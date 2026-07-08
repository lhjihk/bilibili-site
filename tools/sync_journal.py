#!/usr/bin/env python3
# ============================================================
# 手账同步器：Obsidian 发布区 → 网站
#   来源: /media/psf/ZENMUS/90-网站发布区/<桶>/<笔记>.md
#   产出: articles/<id>.md + assets/notes/<id>/*.jpg + content.json 合并
# 规则:
#   - 文件夹名 = 分桶（可在编辑台手动改，改过的不会被覆盖）
#   - 已存在的文章只更新正文，标题/摘要/锁定/坐标等元数据保留
#   - 图片自动压缩为 JPEG (最长边1600px)，路径自动改写
#   - 摘要缺失时自动取正文开头
# 用法: python3 tools/sync_journal.py
# ============================================================
import json, os, re, sys, shutil, unicodedata

VAULT_PUB = '/media/psf/ZENMUS/90-网站发布区'
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(REPO, 'data', 'content.json')
ART_DIR = os.path.join(REPO, 'articles')
IMG_DIR = os.path.join(REPO, 'assets', 'notes')

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def slug(name):
    s = unicodedata.normalize('NFKC', name)
    s = re.sub(r'[^\w一-鿿]+', '-', s).strip('-')
    return s or 'note'

def parse_frontmatter(md):
    meta = {}
    m = re.match(r'^---\n(.*?)\n---\n?', md, re.S)
    if m:
        for line in m.group(1).splitlines():
            kv = re.match(r'^(\w[\w-]*):\s*(.*)$', line)
            if kv:
                meta[kv.group(1)] = kv.group(2).strip().strip('"\'')
        md = md[m.end():]
    return meta, md

def auto_excerpt(body):
    # 去标题/图片/空行，取第一段文字
    for line in body.splitlines():
        t = re.sub(r'^#+\s*', '', line).strip()
        t = re.sub(r'!\[[^\]]*\]\([^)]*\)|!\[\[[^\]]*\]\]', '', t).strip()
        if len(t) >= 12:
            return t[:64] + ('…' if len(t) > 64 else '')
    return ''

def compress_img(src, dst):
    if not HAS_PIL:
        shutil.copy2(src, dst)
        return
    try:
        im = Image.open(src)
        im = im.convert('RGB')
        w, h = im.size
        if max(w, h) > 1600:
            r = 1600 / max(w, h)
            im = im.resize((int(w * r), int(h * r)), Image.LANCZOS)
        im.save(dst, 'JPEG', quality=82, optimize=True)
    except Exception as e:
        print('  图片压缩失败, 原样复制:', src, e)
        shutil.copy2(src, dst)

def process_images(body, note_name, note_id, src_dir_root):
    """把 assets/<note>/<file> 或 ![[file]] 改写为 assets/notes/<id>/<file>.jpg 并压缩"""
    out_dir = os.path.join(IMG_DIR, note_id)
    def handle(src_rel):
        # 源文件绝对路径（相对 vault 根或笔记所在目录）
        cands = [os.path.join(src_dir_root, src_rel),
                 os.path.join('/media/psf/ZENMUS', src_rel)]
        src = next((c for c in cands if os.path.isfile(c)), None)
        if not src:
            return None
        os.makedirs(out_dir, exist_ok=True)
        base = os.path.splitext(os.path.basename(src_rel))[0]
        dst_name = base + '.jpg'
        dst = os.path.join(out_dir, dst_name)
        if not os.path.exists(dst) or os.path.getmtime(src) > os.path.getmtime(dst):
            compress_img(src, dst)
        return f'assets/notes/{note_id}/{dst_name}'
    def repl_std(m):
        new = handle(m.group(2))
        return f'![{m.group(1)}]({new})' if new else ''
    def repl_wiki(m):
        new = handle('assets/' + m.group(1)) or handle(m.group(1))
        return f'![]({new})' if new else ''
    body = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', repl_std, body)
    body = re.sub(r'!\[\[([^\]|]+?)(?:\|[^\]]*)?\]\]', repl_wiki, body)
    return body

def main():
    if not os.path.isdir(VAULT_PUB):
        sys.exit('发布区不存在: ' + VAULT_PUB)
    data = json.load(open(CONTENT, encoding='utf-8'))
    existing = {a['id']: a for a in data.get('articles', [])}
    os.makedirs(ART_DIR, exist_ok=True)
    seen, added, updated = [], 0, 0

    for bucket in sorted(os.listdir(VAULT_PUB)):
        bdir = os.path.join(VAULT_PUB, bucket)
        if not os.path.isdir(bdir) or bucket.startswith('.'):
            continue
        for fn in sorted(os.listdir(bdir)):
            if not fn.endswith('.md'):
                continue
            name = fn[:-3]
            nid = slug(name)
            raw = open(os.path.join(bdir, fn), encoding='utf-8').read()
            meta, body = parse_frontmatter(raw)
            body = process_images(body, name, nid, bdir)
            open(os.path.join(ART_DIR, nid + '.md'), 'w', encoding='utf-8').write(body.strip() + '\n')

            date = meta.get('date') or meta.get('created') or ''
            year = (re.match(r'(\d{4})', date) or [None, ''])[1]
            if nid in existing:
                a = existing[nid]
                a['file'] = f'articles/{nid}.md'
                if not a.get('bucket'):
                    a['bucket'] = bucket
                if not a.get('excerpt'):
                    a['excerpt'] = auto_excerpt(body)
                updated += 1
            else:
                a = {
                    'id': nid, 'title': name.replace('🎵', '').strip(),
                    'date': date, 'year': year or '未纪年',
                    'place': '', 'coord': '', 'bucket': bucket,
                    'locked': False,
                    'excerpt': auto_excerpt(body),
                    'file': f'articles/{nid}.md',
                }
                existing[nid] = a
                added += 1
            seen.append(nid)

    # 排序：年份倒序，未纪年放最后
    def key(a):
        y = a.get('year') or ''
        return (0, y) if re.match(r'\d{4}', y) else (1, '')
    arts = list(existing.values())
    arts.sort(key=key, reverse=True)
    data['articles'] = arts
    json.dump(data, open(CONTENT, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print(f'同步完成: 新增 {added} / 更新 {updated} / 共 {len(arts)} 篇')

if __name__ == '__main__':
    main()
