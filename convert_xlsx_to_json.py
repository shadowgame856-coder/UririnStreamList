"""
把 streams.xlsx / songs.xlsx 轉成 streams.json / songs.json
用法：python convert_xlsx_to_json.py
預期這支程式跟兩個 xlsx 檔案在同一個資料夾（repo 根目錄）
"""
import openpyxl, json, re, datetime, os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SONGS_PATH = os.path.join(BASE_DIR, 'songs.xlsx')
STREAMS_PATH = os.path.join(BASE_DIR, 'streams.xlsx')


def header_map(ws):
    header_row = next(ws.iter_rows(min_row=1, max_row=1, values_only=True))
    m = {}
    for idx, name in enumerate(header_row):
        if name is None:
            continue
        m[str(name).strip().lower()] = idx
    return m


def normalize_id(v):
    if v in (None, ''):
        return ''
    try:
        f = float(v)
        if f == int(f):
            return str(int(f))
        return str(f)
    except (ValueError, TypeError):
        return str(v).strip()


def get(row, m, *keys, default=None):
    for k in keys:
        if k in m:
            idx = m[k]
            if idx < len(row):
                v = row[idx]
                if v not in (None, ''):
                    return v
    return default


def parse_tags(v):
    if v in (None, ''):
        return []
    return [t.strip() for t in re.split(r'[,\uff0c]', str(v)) if t.strip()]


def time_to_seconds(v):
    if v in (None, ''):
        return 0
    if isinstance(v, datetime.timedelta):
        return int(v.total_seconds())
    if isinstance(v, datetime.time):
        return v.hour * 3600 + v.minute * 60 + v.second
    if isinstance(v, (int, float)):
        return int(v * 86400)
    parts = str(v).split(':')
    try:
        parts = [int(p) for p in parts]
    except ValueError:
        return 0
    seconds = 0
    for p in parts:
        seconds = seconds * 60 + p
    return seconds


def seconds_to_display(sec):
    sec = int(sec)
    h, rem = divmod(sec, 3600)
    m, s = divmod(rem, 60)
    if h:
        return f'{h}:{m:02d}:{s:02d}'
    return f'{m}:{s:02d}'


def date_to_str(v):
    if v in (None, ''):
        return ''
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime('%Y-%m-%d')
    return str(v).strip()


# ---------- streams.xlsx：一個工作表 = 一個年份 ----------
wb_streams = openpyxl.load_workbook(STREAMS_PATH, data_only=True)
streams = {}
stream_years = []
for sheet_name in wb_streams.sheetnames:
    ws = wb_streams[sheet_name]
    m = header_map(ws)
    stream_years.append(sheet_name)
    for row in ws.iter_rows(min_row=2, values_only=True):
        sid = get(row, m, 'id')
        if sid in (None, ''):
            continue
        sid = normalize_id(sid)
        streams[sid] = {
            'id': sid,
            'year': sheet_name,
            'date': date_to_str(get(row, m, 'date')),
            'title': str(get(row, m, 'title', default='') or ''),
            'url': str(get(row, m, 'url', default='') or ''),
            'tags': parse_tags(get(row, m, 'tag', 'tags')),
            'guests': parse_tags(get(row, m, 'feat', 'guests', 'guest', '來賓')),
        }

with open(os.path.join(BASE_DIR, 'streams.json'), 'w', encoding='utf-8') as f:
    json.dump({'streams': streams, 'streamYears': stream_years}, f, ensure_ascii=False)

# ---------- songs.xlsx：一個工作表 = 一個語言 ----------
wb_songs = openpyxl.load_workbook(SONGS_PATH, data_only=True)
songs = {}
for sheet_name in wb_songs.sheetnames:
    ws = wb_songs[sheet_name]
    m = header_map(ws)
    lst = []
    for row in ws.iter_rows(min_row=2, values_only=True):
        song_id = get(row, m, 'id')
        if song_id in (None, ''):
            continue
        seconds = time_to_seconds(get(row, m, 'time'))
        lst.append({
            'id': normalize_id(song_id),
            'streamId': normalize_id(get(row, m, 'stream_id')),
            'timeSeconds': seconds,
            'timeDisplay': seconds_to_display(seconds) if seconds else '',
            'name': str(get(row, m, 'name', default='') or ''),
            'artist': str(get(row, m, 'artist', default='') or ''),
            'tags': parse_tags(get(row, m, 'tags', 'tag')),
            'note': str(get(row, m, 'note', default='') or ''),
            'url': str(get(row, m, 'url', default='') or ''),
        })
    songs[sheet_name] = lst

with open(os.path.join(BASE_DIR, 'songs.json'), 'w', encoding='utf-8') as f:
    json.dump({'songs': songs}, f, ensure_ascii=False)

print('轉換完成：streams.json, songs.json')
