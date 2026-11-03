# gera client/public/dados/compendio/<kit>.json a partir de docs/compendio/compendio-<classe>.md (03/11)
import re, json, os, glob
KIT = {'humano':'human','anao':'dwarf','elfo':'elf','nordico':'nordic','paladino':'pal','tecnocrata':'tecno','vampiro':'vam','lobisomem':'lob','mago':'mag','bruxo':'bru','cacador':'cac'}
RUN = {'Lágrima':'lagrima','Olho Kármico':'olho','Ampulheta':'ampulheta','Labirinto':'labirinto','Fome':'fome','Fresta':'fresta'}
def pct(t):
    m = re.search(r'([+−-]?\d+(?:[.,]\d+)?)\s*%', t)
    return float(m.group(1).replace(',', '.').replace('−','-')) if m else None
def stat_of(t):
    t2 = t.lower()
    for k, ws in [('crit', ['crítico','critico']), ('cd', ['recarga']), ('cost', ['custo']), ('dur', ['duração','dura ']), ('area', ['área','raio','alcance','cone']), ('heal', ['cura','vida por']), ('dmg', ['dano'])]:
        if any(w in t2 for w in ws): return k
    return 'other'
import pathlib; ROOT = pathlib.Path(__file__).resolve().parent.parent; out_dir = str(ROOT / 'client/public/dados/compendio')
for f in glob.glob(str(ROOT / 'docs/compendio/compendio-*.md')):
    cls = f.split('compendio-')[1][:-3]; kit = KIT[cls]; s = open(f, encoding='utf-8').read()
    title = re.search(r'^# Compêndio — (.+)$', s, re.M).group(1).strip()
    intro = (re.search(r'^> (.+)$', s, re.M) or [None, ''])[1]
    acts = []
    for m in re.finditer(r'^### (\d+)\. (.+?)$\n(.*?)(?=^### |^## )', s, re.M | re.S):
        n = int(m.group(1)); head = m.group(2); body = m.group(3).strip()
        parts = [p.strip() for p in head.split('·')]; name = parts[0]
        typ = parts[1] if len(parts) > 1 else ''
        lv = re.search(r'nível (\d+)', head); key = re.search(r'tecla ([^)\s]+)', head)
        lines = body.split('\n'); desc = []; runes = {}; desperta = ''
        for ln in lines:
            r = re.match(r'- \*\*(Lágrima|Olho Kármico|Ampulheta|Labirinto|Fome|Fresta):\*\*\s*(.*)', ln)
            d = re.match(r'- \*\*Desperta(?: \(([^)]+)\))?:\*\*\s*(.*)', ln)
            if r: runes[RUN[r.group(1)]] = r.group(2).strip()
            elif d: desperta = ((d.group(1) + ': ') if d.group(1) else '') + d.group(2).strip()
            elif ln.strip(): desc.append(ln.strip())
        acts.append({'n': n, 'name': name, 'type': typ, 'lvl': int(lv.group(1)) if lv else 1, 'key': key.group(1) if key else None, 'desc': ' '.join(desc), 'runes': runes, 'desperta': desperta, 'sup': n >= 19, 'aura': n in (17, 18)})
    sp = []; cp = []
    sec = s.split('## Passivas de magia', 1)[1]; spt, rest = sec.split('## Passivas de classe', 1); cpt = rest.split('## Combinações assinatura', 1)[0]
    for ln in spt.split('\n'):
        c = [x.strip() for x in ln.strip().strip('|').split('|')]
        if len(c) >= 6 and c[0].isdigit():
            lv = c[3:6]; st = stat_of(lv[0]); st = st if st != 'other' else stat_of(' '.join(lv))
            v = []; unit = None
            for x in lv:
                m = re.search(r'([+−-]?\d+(?:[.,]\d+)?)\s*(%|s\b|m\b|)', x)
                if m: u = m.group(2) or unit or ''; unit = unit or u; v.append([abs(float(m.group(1).replace(',', '.').replace('−', '-'))), u])
                else: v.append(None)
            # níveis 2 e 3 às vezes trazem só o número ("+10%")
            sp.append({'n': int(c[0]), 'name': c[1], 'target': c[2], 'lv': lv, 'stat': st, 'v': v})
    for ln in cpt.split('\n'):
        c = [x.strip() for x in ln.strip().strip('|').split('|')]
        if len(c) >= 4 and c[0].isdigit():
            nums = re.findall(r'(\d+(?:[.,]\d+)?)\s*%', c[3]); st = stat_of(c[3])
            cp.append({'n': int(c[0]), 'name': c[1], 'levels': int(re.sub(r'\D', '', c[2]) or 3), 'eff': c[3], 'stat': st, 'v': [float(x.replace(',', '.')) for x in nums[:5]]})
    combos = re.findall(r'^- (.+)$', s.split('## Combinações assinatura', 1)[1], re.M) if '## Combinações assinatura' in s else []
    def clean(o):
        if isinstance(o, str): return re.sub(r'\*\*(.+?)\*\*', r'\1', o).replace('**', '')
        if isinstance(o, list): return [clean(x) for x in o]
        if isinstance(o, dict): return {k: clean(v) for k, v in o.items()}
        return o
    json.dump(clean({'kit': kit, 'title': title, 'intro': intro, 'actives': acts, 'spellPassives': sp, 'classPassives': cp, 'combos': combos}), open(f'{out_dir}/{kit}.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(kit, len(acts), len(sp), len(cp), sum(1 for x in sp if x['stat'] != 'other' and x['v'][0] is not None), sum(1 for a in acts if a['key']))
