# CLAUDE.md

## 프로젝트 개요
한로로(HANRORO) 비공식 팬사이트. 정적 HTML/CSS/JS + Supabase 백엔드.

## 파일 구조
```
hanroro/
├── index.html          메인 (히어로, 프로필, 자몽살구클럽, 음반, 듣기, 문장, 무대,
│                       행보, 표지, 링크, CTA, 푸터, 숨은 문장 판)
├── album-ep1.html      1st EP 이상비행 (2023.08.29, 6곡)
├── album-ep2.html      2nd EP 집 (2024.05.28, 7곡)
├── album-ep3.html      3rd EP 자몽살구클럽 (2025.08.04, 7곡)
├── album-single.html   데뷔 싱글 입춘 (2022.03.14, 수록곡 섹션 없음)
├── album-youandi.html  9th 디지털 싱글 너와 나 (2026.07.09, 3:38, 폼폼푸린 컬래버)
│                       유일하게 `.liner`(앨범 소개글) 섹션을 쓴다
│                       ↑ 다섯 앨범 페이지 모두 메인 셸을 쓰지 않는다 (theme.js·토글 없음)
├── guestbook.html      방명록 (폼 + 목록)
├── css/style.css       메인·방명록 스타일 (밤/낮 2테마, CSS 변수, 반응형 4단계)
├── css/album.css       앨범 페이지 전용 — 앨범별 세계(색·바탕)와 레이아웃 전부.
│                       index.html도 표지 칩 색 때문에 함께 읽는다
├── js/theme.js         테마 전환 (밤/낮, localStorage) — <head>에서 동기 로드
├── js/guestbook.js     방명록 로직 (Supabase CRUD, 비밀번호 검증, 모달 설정, 빈칸 안내)
├── js/likes.js         앨범 좋아요 — 앨범 페이지 전용. supabase-js 없이 fetch로 REST 직접 호출
├── js/disco.js         음반 거르기 (종류 × 연도). DOM에 hidden만 토글 — index 전용
├── js/player.js        듣기 — 유튜브 파사드. 곡을 고르거나 누를 때 iframe 생성 — index 전용
├── js/live.js          공연까지 남은 날(D-4) 배지 — index 전용
├── js/egg.js           숨은 문장(1111) — index 전용
├── selfcheck.html      자체검사. index를 iframe으로 띄워 실제로 눌러본다 (27항목)
├── shot.sh             헤드리스 크롬 렌더 헬퍼 (테마 고정 포함)
├── PROGRESS.md         spec.md 실행 진행표 — 새 세션은 이 파일부터
├── DECISIONS.md        그때그때의 판단과 이유
├── spec.md             원본 요구사항
├── favicon.svg         탭 아이콘 — 0+0=∞ 를 겹친 두 고리로 줄인 것. 7개 페이지 전부 링크됨
├── img/                모든 이미지는 여기에만 둔다
│   ├── background.jpg  히어로 배경
│   ├── profile.jpg     프로필 사진
│   ├── card.jpg        링크 그리드 사진
│   ├── cover-{ep1,ep2,ep3,single,youandi}.jpg  실제 앨범 표지 (파일명 = data-album 값)
│   └── disc-*.jpg      전용 페이지가 없는 싱글·OST 표지 17장 (벅스 200px 원본).
│                       index.html '그 밖의 싱글' 목록에서만 쓴다 — album.css의
│                       `--cover` 규칙과 무관하므로 cover- 접두사를 쓰지 말 것
├── README.md           사람용 문서 (이 파일은 에이전트용). 기능을 바꾸면 둘 다 고칠 것
├── .mcp.json           Supabase MCP 설정 — **`.gitignore`됨**. 새 환경에선 다시 만들어야 한다
└── .claude/skills/frontend-design/
```
`.gitignore`: `.agents/` `.claude/` `skills-lock.json` `.mcp.json`

## 기술 스택
- **프론트**: 순수 HTML/CSS/JS (빌드 도구 없음)
- **백엔드**: Supabase (PostgreSQL + REST API)
- **라이브러리** (CDN, 전부 **버전 고정 + SRI**):
  - `@supabase/supabase-js@2.111.0` — DB 클라이언트 (방명록만)
  - `sweetalert2@11.26.25` — alert/confirm 모달
  - `dayjs@1.11.21` + relativeTime + ko 로케일 — 시간 포맷팅
  - `aos@2.3.1` — 스크롤 애니메이션 (reduced-motion 시 `disable` 콜백으로 끔)

- **폰트는 `rel="preload" as="style"` + `onload`로 싣는다. 평범한 `rel="stylesheet"`로
  되돌리지 말 것.** 한글 웹폰트는 서브셋이 수십 개로 쪼개져 스타일시트만 78KB이고,
  이게 렌더를 막는 자리에 있으면 첫 페인트가 **2.1s → 12.7s**로 밀린다(실측).
  받는 동안 글자는 CSS 폰트 스택의 대체 글꼴로 보이며, `display=swap`이라 어차피
  한 번은 바뀌던 것이다. `<noscript>` 대비도 함께 둔다. 7개 페이지 전부 같은 방식
- **CSS에서 안 쓰는 굵기를 요청하지 말 것.** 한글 폰트는 굵기 하나가 곧 파일 수십 개다
  (`font-weight:600`을 아무도 안 쓰는데 받고 있었다)

  버전을 올리면 `integrity` 해시를 반드시 다시 계산할 것:
  `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`

## Supabase 설정
- **Project ID**: `avsnujrdogkxvhtelrzx`
- **Region**: ap-northeast-1
- **API URL**: `https://avsnujrdogkxvhtelrzx.supabase.co`
- **Anon Key**: `js/guestbook.js` 상단에 하드코딩 (공개용, RLS로 보호)

## 작업 환경 (다른 세션에서 이어받을 때)
- **Supabase MCP가 붙어 있다.** `.mcp.json`(프로젝트 루트, `.gitignore`됨)에
  `https://mcp.supabase.com/mcp?project_ref=avsnujrdogkxvhtelrzx&features=docs,database,debugging,development,functions`.
  세션마다 `/mcp`에서 OAuth 인증이 필요할 수 있다. 안 붙어 있으면 `claude mcp list`로 확인
- **DB 변경은 `apply_migration`으로.** `execute_sql`은 조회·정리용. 적용 뒤에는
  **anon 키로 curl을 날려 바깥에서 실제로 막히는지 확인**할 것 (권한은 대시보드에서 보는 것과 다르게 동작한다)
- 적용된 마이그레이션 (`supabase_migrations.schema_migrations`):
  `create_guestbook_table` → `grant_guestbook_privileges` → `guestbook_update_delete_policies` →
  `guestbook_password_feature` → `harden_guestbook_password_hash` →
  `guestbook_column_level_select_only` → `album_like_counter` → `guestbook_input_validation_and_throttle`

### 자체검사
```bash
python -m http.server 8000 --directory <프로젝트 경로> &
chrome --headless=new --disable-gpu --no-sandbox --virtual-time-budget=12000   --dump-dom "http://localhost:8000/selfcheck.html" | grep -o '<title>[^<]*</title>'
# → PASS 27/27
```
`selfcheck.html`이 `index.html`을 iframe으로 띄워 거르기·재생·숨은 문장을 실제로 눌러본다.
**손으로 만지는 JS를 고쳤으면 여기부터 돌릴 것.** `file://`로는 안 된다(같은 출처가 아니라 iframe 안을 못 읽는다).

### 화면 확인 방법
빌드가 없으므로 **헤드리스 크롬으로 렌더해서 눈으로 확인**하는 게 가장 빠르다.
`bash shot.sh <페이지> <dark|light> <가로> <세로>`가 테마 고정(theme.js 제거)까지 해준다.
```bash
python -m http.server 8000 --directory <프로젝트 경로> &
chrome --headless=new --disable-gpu --hide-scrollbars   --window-size=1280,2000 --virtual-time-budget=6000   --screenshot=out.png "http://localhost:8000/album-ep3.html"
```
- ⚠️ **`file://`이나 페이지 조각으로 열면 안 된다.** AOS가 `[data-aos]`를 `opacity:0`으로
  깔아두기 때문에 `aos.js`가 실행되지 않으면 **화면이 통째로 비어 보인다**. 조각을 테스트하려면
  AOS 스크립트도 같이 넣을 것
- 테마·앨범을 강제로 보려면 `<html>`에 `data-theme="light"` / `data-album="ep2"`를 박은
  임시 복사본을 만들어 열면 된다 (앨범 페이지는 `theme.js`를 안 싣는다)
- 넘침 검사는 `document.title`에 결과를 쓰고 `--dump-dom | grep '<title>'`로 받는 게 편하다

## DB 스키마 (`public.album_like`)
| 컬럼 | 타입 | 제약 |
|------|------|------|
| album | text | PK. `<html data-album>` 값과 같아야 한다 |
| likes | integer | NOT NULL, default 0, `check (likes >= 0)` |

행은 앨범당 하나씩 미리 넣어두고 늘 존재한다(ep1·ep2·ep3·single·youandi).
**앨범 페이지를 새로 만들면 이 표에 행을 먼저 넣을 것** — 없는 키로 RPC를 부르면 22023으로 거부된다.

## DB 스키마 (`public.guestbook`)
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| message | text | NOT NULL |
| created_at | timestamptz | NOT NULL, default now() |
| password_hash | text | NOT NULL (bcrypt) |

## 보안 구조
- **RLS**: 활성화. 정책은 `guestbook_select_all`(SELECT, `true`) 하나뿐 —
  INSERT/UPDATE/DELETE 정책이 없어서 anon의 직접 조작은 전부 막힌다
- **컬럼 권한**: `anon`·`authenticated`에게 **테이블 SELECT가 아니라 컬럼 SELECT**를 준다.
  ```sql
  revoke select on public.guestbook from anon, authenticated;
  grant select (id, name, message, created_at) on public.guestbook to anon, authenticated;
  ```
  → `password_hash`는 REST로 못 읽는다. **`select('*')`도 42501로 막히니** 클라이언트는
  항상 컬럼을 명시할 것 (`js/guestbook.js`는 `select('id, name, message, created_at')`)
  ⚠️ 테이블 단위 GRANT가 살아 있으면 컬럼 단위 `revoke`는 **조용히 무시된다**. 반드시 위 순서로
- **RPC 함수** (security definer, `search_path = public, extensions` 고정)로만 데이터 조작:
  - `sign_guestbook(p_name, p_message, p_password)` — 작성 (bcrypt 해싱)
  - `edit_guestbook(p_id, p_password, p_message)` — 수정 (비밀번호 검증)
  - `remove_guestbook(p_id, p_password)` — 삭제 (비밀번호 검증)
  - `like_album(p_album, p_on)` — 좋아요 증감. 새 값을 정수로 돌려준다.
    `album_like`도 guestbook과 같은 방식(테이블 권한 회수 + 컬럼 SELECT만)이라 직접 UPDATE는 42501
- **비밀번호**: pgcrypto `crypt()` + `gen_salt('bf', 10)`. **cost를 10 미만으로 낮추지 말 것**
  (기본값 6은 오프라인 크래킹에 너무 약하다). pgcrypto는 `extensions` 스키마에 있다
- ⚠️ **2026-07-29 이전 작성 6건은 cost-6 해시**이고, 그 시기에 `password_hash`가 REST로
  공개돼 있었다. 유출됐다면 그 글의 수정·삭제 권한이 남에게 있을 수 있다. 재해싱은 원문
  비밀번호를 모르므로 불가 — 알고도 그대로 두기로 한 결정이다. 그 6건에 이상한 수정/삭제가
  보이면 원인은 이것
- **입력 검증은 서버(RPC)가 한다.** 브라우저 `maxlength`는 curl 한 줄로 우회되므로
  `sign_guestbook`이 이름 1~30자·내용 1~500자·비밀번호 4자 이상을 다시 확인하고,
  `guestbook` 테이블에도 같은 길이 `check` 제약이 걸려 있다 (bcrypt는 72바이트까지만 보므로 그 위도 거부)
- **무차별 대입 제한**: `public.guestbook_attempt`(entry_id, at)에 실패를 적어두고
  **글 하나당 5분에 10회**를 넘으면 수정·삭제를 거부한다. 성공하면 그 글의 기록을 지우고,
  하루 지난 기록은 실패할 때마다 함께 청소한다(pg_cron 없이). 이 테이블은 RLS만 켜고
  **정책을 하나도 만들지 않았다** = anon 접근 전면 차단
  ⚠️ 남의 글에 일부러 10번 틀려 5분간 잠글 수 있다. 자동 해제되는 성가심 수준이라 감수한 설계
- **도배 방지**: 같은 이름+내용을 1분 안에 다시 넣으면 거부
- **CDN 무결성**: 모든 외부 스크립트·CSS는 **버전 고정 + `integrity`(SRI) + `crossorigin`**.
  버전을 올릴 땐 해시를 다시 계산할 것:
  `curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A`
- **XSS 방지**: `escapeHtml()`로 모든 사용자 입력 이스케이프.
  `innerHTML`에 값을 넣는 자리는 전부 이 함수를 통과해야 한다 (`gb-entry`, 인라인 편집 textarea, 삭제 확인 모달)

## 디자인 컨셉 — "쓰는 사람"
한로로는 **가사보다 산문을 먼저 쓰는 국문학도**다. 3집 〈자몽살구클럽〉은 동명 소설과
세계관을 공유한다. 그래서 이 사이트는 "가수 팬페이지"가 아니라 **한 권의 책**으로 설계됐다.
카피·구조·타이포 결정은 전부 이 논지에서 파생된다.

팔레트 근거는 데뷔곡 **'입춘'** — 겨울 끝, 아직 어두운데 봄이라 부르는 절기.
먹밤 바탕 위로 자몽(루비)·살구(앰버)의 여명이 트는 구조.

## 디자인 시스템 — 2테마 (밤 / 낮)
`<html data-theme="dark|light">`로 전환. **모든 색은 CSS 변수**이고 두 테마가
**정확히 같은 변수 집합**을 정의한다. 한쪽에만 변수를 추가하면 다른 테마가 깨진다.

| 변수 | 밤(기본) | 낮 | 용도 |
|------|---------|-----|------|
| `--bg` | `#13141b` | `#fff7f3` | 기본 배경 |
| `--surface` | `#1a1b25` | `#fdeee6` | 떠오른 표면 (club, activity, cta, 입력창) |
| `--surface-2` | `#22232f` | `#f8ddd2` | 카드 호버 표면 |
| `--text` | `#f3ede3` | `#3a2a2c` | 본문 |
| `--text-dim` | `#a8a3b2` | `#5e484c` | 서브 |
| `--text-far` | `#8a8697` | `#7f676b` | 캡션 / 날짜 / 메타 |
| `--grapefruit` | `#e05a7a` | `#c33a60` | 자몽 — **글자용** eyebrow·강조 |
| `--apricot` | `#f0a45c` | `#94540b` | 살구 — **글자용** 호버·활성 |
| `--line` / `--line-soft` | 13% / 7% | 15% / 7% | 보더 / 원고지 칸 |
| `--hero-ink` | `#f3ede3` | `#6a4a4f` | 히어로 제목 '한' — 본문색과 따로 잡는다 |
| `--hero-rr` | 자몽→살구 원색 | `#e0527a`→`#cf7517` | 히어로 '로로' 그라디언트 |
| `--header-bg` `--hero-veil` `--hero-filter` `--photo-scrim` `--scrim` `--shadow-lift` | 테마별 | | 합성 값 |

**`--brand-1` `#e05a7a` / `--brand-2` `#f0a45c` / `--btn-ink` `#16121a`** — 테마 무관 고정
(앨범 페이지에서만 표지색으로 덮인다). 자몽·살구 원색은 버튼·배지·그라디언트 선 등 **채움에만** 쓰고,
그 위의 글자는 `--btn-ink`를 쓴다. 밝은 배경에서 대비가 안 나오므로 **원색을 글자색으로 쓰지 말 것**
(글자에는 `--grapefruit`/`--apricot`을 쓴다. 이 둘은 테마별로 대비를 맞춰둔 값이다).

- **폰트**: `--serif` Gowun Batang(제목·인용) / `--sans` IBM Plex Sans KR(본문, 300) / `--mono` IBM Plex Mono(날짜·라벨·eyebrow)
- **한글 줄바꿈**: `body`에 `word-break:keep-all` + `overflow-wrap:break-word` + `text-wrap:pretty`.
  브라우저 기본값은 음절 단위로 끊어서 '됩니다'가 '됩니 / 다'로 쪼개진다. keep-all이 어절 단위로 묶고,
  띄어쓰기 없는 긴 문자열(URL·ㅋㅋㅋ 도배)만 break-word가 풀어준다. **keep-all만 넣으면 안 된다** — 방명록에
  띄어쓰기 없는 긴 글이 들어오면 레이아웃이 터진다
- **줄폭(`max-width: Nch`)은 한글 기준으로 잡을 것.** `ch`는 숫자 0 한 글자 폭이라
  **한글 1자 ≈ 2ch**다. 56ch로 두면 한글 28자밖에 안 들어가 짧은 문장도 억지로 접힌다.
  본문은 74~78ch(37~39자), 히어로·리드는 52~58ch 선에서 잡아뒀다
- **히어로 제목**: 사진 위에 얹히므로 본문색을 쓰지 않는다. 낮 모드는 옅은 사진 위에서 먹색이
  너무 무거워 한 단계 밝은 값을 따로 뒀다. 큰 글자라 AA 기준은 3:1이고 현재 7.3:1 / 4.2:1 / 3.2:1
- **시그니처**: `.manuscript` — 46px 원고지 칸 그리드. 순수 CSS, 이미지 없음. 히어로와 자몽살구클럽에만
- **배지**: `.badge` + `.badge-solid|ghost` + 위치 `.badge-tl|br|tr|hero-badge`, 지연 `.badge-float-2|3`.
  `transform`이 아니라 **`translate` 프로퍼티**로 떠오르게 했다 — `transform:rotate()`로 준 기울기와 겹치지 않게 하려는 것
- **레이아웃 유틸**: `.band` `.wrap`(1120) `.wrap-narrow`(720) `.eyebrow` `.band-title` `.band-sub`
- **`auto-fill`/`auto-fit` 격자에는 `minmax(min(Npx, 100%), 1fr)`을 쓸 것.** `minmax(430px, 1fr)`로
  두면 화면이 430px보다 좁을 때 칸이 줄지 않아 가로로 넘친다 (`.disc-list`가 390px에서 63px 넘쳤다).
  **최솟값은 휴대폰(390px, 안쪽 폭 350px)에서 두 칸이 서는지 보고 정할 것** — 넘치지 않아도
  한 칸으로 떨어지면 부차적인 블록이 화면 두 장을 먹는다 (`.sib-grid` 190px → 158px, 1897 → 468px)
- **반응형**: 1100px(링크 그리드 2열+사진 배너), 900px(about 1단·히어로 배지 숨김), 760px(헤더 세로), 480px(버튼 full-width)
- **접근성**: 두 테마 모두 **WCAG AA 통과 확인됨**(본문/서브/캡션/강조 전부 ≥4.5:1). `:focus-visible` 아웃라인, `prefers-reduced-motion` 시 애니메이션·AOS·배지 부유 전부 정지

## 앨범 페이지 — 메인과 분리된 독립 페이지
앨범 페이지는 메인 사이트의 셸(헤더·히어로·밴드·푸터)을 쓰지 않는다.
**`css/album.css`가 레이아웃과 색을 전부 새로 정의**하고, `style.css`에서는
폰트 변수·리셋·`.btn`만 빌려 쓴다. `<html data-album="ep1|ep2|ep3|single|youandi">`가 스위치.

- **밤/낮 테마가 없다.** 앨범 페이지는 그 표지의 세계 하나만 입는다 —
  `js/theme.js`도, 토글 버튼도 싣지 않는다. `data-theme`이 없으므로 `style.css`의
  밤 기본값이 깔리고 그 위를 `album.css`의 앨범별 블록이 덮는다.
  (메인에서 낮 모드로 보던 사람이 앨범을 열면 그 앨범의 세계로 바뀐다. 의도된 동작)
- 색은 **전부 실제 표지(`img/cover-*.jpg`)에서 뽑았다.** 표지를 교체하면 다시 뽑아야 한다

| | 앨범 | 브랜드 2색 | 바탕 | 표지 |
|---|------|-----------|------|------|
| ep1 | 이상비행 | `#2f27e8` → `#6a5cff` | `#06060f` 밤 | 검정 위 전기 파랑, 원형 광선 속 잠수부 |
| ep2 | 집 | `#d8271d` → `#9c130e` | `#0a0607` 밤 | 검정 위 붉은 화염, 불타는 집 |
| ep3 | 자몽살구클럽 | `#e05a7a` → `#f0a45c` | `#fbf6f0` **낮** | 흰 종이에 색연필로 그린 자몽·살구 |
| single | 입춘 | `#7d8fa8` → `#c9a86b` | `#0d141d` 밤 | 역광 바다 사진 — 푸른 새벽과 금빛 물비늘 |
| youandi | 너와 나 | `#f9e158` → `#f0c33e` | `#f0f9fb` **낮** | 하늘색 바탕에 비눗방울, 전부 남색 선으로 그린 산리오 일러스트 (글자색도 그 남색 `#22306b`) |

- 각 앨범 블록은 `--bg --surface --surface-2 --text --text-dim --text-far --line --line-soft`를
  **전부** 정의한다. 하나라도 빠지면 메인의 밤 값이 새어 들어온다
- **`--btn-ink`** — 브랜드색으로 채운 면 위의 글자색. ep1·ep2는 원색이 어두워
  기본 먹색(`#16121a`)으로는 버튼 글자가 4.5:1을 못 넘긴다. `--brand-*`로 채우는 요소
  (`.btn` `.badge-solid` `.trk-flag` `.hr-swal-confirm`)는 전부 이 변수를 쓴다
- `.cover-ep1|ep2|ep3|single|youandi`는 **메인 음반 목록의 작은 표지 칩**용. 그래서 `index.html`도
  `album.css`를 읽는다

### 페이지 구조 (album.css 클래스)
`.ah` 얇은 헤더(돌아갈 길만) → `.stage` 표지가 배경인 히어로 → `.note` 해설 →
`.list` 수록곡 → `.liner` 앨범 소개글 → `.sibs` 다른 음반 → `.af` 한 줄 푸터.
(`.list`·`.liner`는 있는 페이지에만 넣는다)

- **`.stage`** — `.stage-art`(표지 원본, `--stage-opacity`/`--stage-blur`)를 깔고
  `::after`가 `--stage-scrim`으로 아래쪽을 바탕색까지 덮는다. **글자는 전부 불투명 구간에만
  앉힌다** — 장막 비율을 낮추면 대비가 깨진다. ep3만 표지가 흰 종이라 장막을 옅게 잡음
- **`.note-body p:first-child::first-letter`** — 첫 글자 드롭캡. 이 페이지가 노래 소개가 아니라
  글이라는 표시. 첫 문단이 `<strong>`으로 시작해도 적용된다
- 860px 이하에서 `.stage-cover`가 `position:static`이 되어 글 위로 올라간다

### 좋아요 버튼
`.stage-actions` 안의 `.like` 하나. `js/likes.js`가 `<html data-album>`을 읽어 동작한다.
- **supabase-js를 싣지 않는다.** 버튼 하나에 라이브러리 40KB는 과해서 `fetch`로 REST를 직접 부른다
  (anon 키는 `likes.js` 안에 따로 박혀 있다 — `guestbook.js`와 중복이지만 공개 키라 문제없다)
- 낙관적 UI: 누르는 즉시 반영하고 실패하면 되돌리며 `.is-failed`로 한 번 흔든다
- 중복 방지는 `localStorage`(`hanroro-like-<album>`)뿐이다. **서버는 호출자를 구분하지 않는다** —
  작정하면 올릴 수 있고, 알고 둔 한계다. 어뷰징이 보이면 IP 기준 rate limit을 붙일 것
- 메인 음반 목록에는 붙이지 않았다. `.record` 카드 전체가 `<a>`라 안에 버튼을 넣으면 중첩된다

### 메인 CSS와 부딪히는 지점 (중요)
`album.css`는 `style.css` **다음에** 로드되고, `index.html`은 두 파일을 다 읽는다.
그래서 **같은 클래스 이름을 절대 쓰면 안 된다.**
- 실제로 터졌던 것: 앨범의 타이틀 칩을 `.tl-flag`로 뒀더니 **메인 행보의 '예정' 배지**를
  덮어버렸다 → `.trk-flag`로 개명. 새 클래스를 추가할 땐 `style.css`에 같은 이름이 있는지 먼저 볼 것
- `<header class="ah">`는 요소 셀렉터 `header{}`와 760px 미디어쿼리(`flex-direction:column`)를
  맞는다. `.ah`가 `flex-direction:row`를 **명시**해 되돌려 놓았다

## 방명록 인라인 편집 (`js/guestbook.js`)
- **빈 칸을 `focus()`만 하고 끝내지 말 것.** 그러면 저장을 눌러도 아무 일도 안 나서
  "수정 기능이 죽었다"로 읽힌다. `complain(el, msg)`가 `setCustomValidity` +
  `reportValidity()`로 브라우저 기본 말풍선을 띄우고, 다음 입력 때 스스로 지운다.
  작성 폼(이름·내용·비밀번호)과 인라인 편집(내용·비밀번호) 다섯 자리 전부 이걸 쓴다.
  **진짜 검증은 여전히 서버(RPC)가 한다** — 이건 안내일 뿐이다
- **편집은 한 번에 하나만.** 저장·취소가 `loadGuestbook()`으로 목록을 통째로 다시 그리므로,
  두 글을 동시에 열어두면 한쪽을 저장하는 순간 다른 쪽에 쓰던 글이 날아간다.
  수정 버튼은 다른 편집창이 열려 있으면 먼저 목록을 새로 그린 뒤 `data-id`로 그 행을 다시 찾는다
- 비밀번호 칸의 Enter는 `gbList`의 `keydown`이 저장 버튼으로 넘긴다 (폼이 아니라 기본 제출이 없다)
- **`maxlength`는 한도에 닿으면 조용히 잘라낸다.** 그러면 "글이 더 안 써진다"로 읽히므로
  작성 폼의 내용 칸 아래에 `.gb-count`(`0 / 500`)를 두고 다 차면 `--grapefruit`으로 바꾼다.
  `maxlength`와 **같은 단위(UTF-16, `value.length`)로 셀 것** — 코드포인트로 세면 이모지에서
  보이는 숫자와 실제 한도가 어긋난다. 여기도 안내일 뿐이고 진짜 검증은 서버(RPC)가 한다

## 모달 (SweetAlert2)
`js/guestbook.js`의 **`SWAL` 상수**를 스프레드해서 쓴다 — `Swal.fire({ ...SWAL, ... })`.
- `buttonsStyling:false` + `customClass`(`.hr-swal*`)로 **CSS가 전권을 갖는다**. `!important` 최소화됨
- **`confirmButtonColor` 같은 인라인 색을 넣지 말 것** — 인라인 색은 테마를 따라가지 못해 모달만 옛 색으로 남는다
- 성공 알림은 `toastSuccess()` (우상단 토스트), 오류는 `alertError()`
- 삭제 확인은 작성자 이름을 보여주고 `focusCancel` + `reverseButtons`로 안전 쪽에 포커스
- **글자 크기 계단**: 제목 1.24rem(serif 700) · 본문/입력 0.95rem · 버튼 0.9rem · 검증 0.85rem.
  전부 `--sans`이고 검증 메시지만 예외였던 mono는 제거함(그 한 줄만 폰트가 튀었다)
- 아이콘은 `.swal2-icon`에 **font-size**로 줄인다(내부가 전부 em). 기본 80px는 모달 폭에 비해 크다
- ⚠️ **토스트는 `.swal2-toast.hr-swal`(클래스 2개)로 잡을 것.** swal2의 `.swal2-popup.swal2-toast`가
  특정도 (0,2,0)이라 `.hr-swal` 한 클래스로는 배경·글자색을 못 이긴다 (흰 배경에 회색 글씨로 남았던 버그)
- 토스트 폭은 `width:fit-content` — `auto`로 두면 swal2 그리드가 가운데 열을 늘린다

## 디스코그래피 (2026.08.02 확인 · 출처 벅스 아티스트 페이지 20155724)
나무위키는 403이라 못 읽는다. **출처는 벅스**(`music.bugs.co.kr/artist/20155724/albums`) —
발매일·수록곡·기획사가 다 있고 앨범 id가 그대로 링크가 된다. 영문 위키백과(`en:Hanroro`)는
차트 성적에 강하지만 수록곡 소속을 틀리게 적어둔 곳이 있다(정류장을 〈이상비행〉에 넣어놨다).

| 발매일 | 제목 | 종류 | 벅스 id |
|--------|------|------|---------|
| 2026.07.30 | 잔혹한 천사의 테제 (J-POP REMAKE Vol.2) | 참여 | 4152581 |
| 2026.07.09 | 너와 나 | 싱글 · **페이지 있음** | 20822999 |
| 2026.04.24 | 안녕 (21세기 대군부인 OST Part.5) | OST | 4146141 |
| 2026.04.02 | 애증 (게임 오버 ? / 1111) | 싱글 (2곡) | 20799969 |
| 2025.11.01 | 뛰어! (마루는 강쥐 OST) | OST | 20764008 |
| 2025.08.04 | 자몽살구클럽 | 3rd EP · **페이지 있음** | 20744778 |
| 2025.07.06 | 도망 | 싱글 (3집 선공개) | 20738207 |
| 2024.10.29 | 나침반 | 싱글 | 20679516 |
| 2024.10.22 | So Nice (GMF Theme Song) | 싱글 (민트페이퍼 기획) | 20678562 |
| 2024.05.28 | 집 | 2nd EP · **페이지 있음** | 20644751 |
| 2024.05.16 | 생존법 | 싱글 (2집 선공개) | 20642713 |
| 2024.04.30 | 먹이사슬 | 싱글 (2집 선공개) | 20639287 |
| 2023.12.26 | 하루살이 | 싱글 | 20613044 |
| 2023.08.29 | 이상비행 | 1st EP · **페이지 있음** | 20586963 |
| 2023.04.21 | 자처 | 싱글 (1집 선공개) | 20560620 |
| 2023.01.04 | 정류장 | 싱글 (앨범 미수록) | 20538423 |
| 2022.10.25 | 당신의 밤은 나의 밤과 같습니까 (feat. 숨비) | 싱글 | 20501510 |
| 2022.09.04 | 비틀비틀 짝짜꿍 | 싱글 | 20490847 |
| 2022.08.13 | Like my groove | 싱글 (OnGray 기획) | 20485543 |
| 2022.07.18 | Do What You Like (나를 사랑하지 않는 X에게 OST Part 2) | OST | 20479597 |
| 2022.06.18 | 거울 | 싱글 | 20474053 |
| 2022.03.14 | 입춘 | 데뷔 싱글 · **페이지 있음** | 20455290 |

**'N번째 디지털 싱글' 번호는 전체 싱글 수와 다르다.** 싱글은 15장이지만 〈너와 나〉는
9번째다. **EP 선공개곡 4장(자처·먹이사슬·생존법·도망)과 외부 기획 2장(Like my groove·
So Nice)이 번호에서 빠지기 때문**이다(15 − 6 = 9). `album-youandi.html`의
'9th Digital Single'은 오타가 아니니 고치지 말 것.

수록곡 순서는 벅스 기준으로 맞춰뒀다. 〈이상비행〉은 이상비행·해초·화해·금붕어·자처·
사랑하게 될 거야 6곡이고 **정류장은 들어 있지 않다.**

## 주요 기능
1. **히어로**: 배경사진 + 먹밤 베일 + 원고지 그리드. 이름 '로로'만 여명 그라디언트(길 로 路 의미)
2. **프로필**: 사진 + 약력 3단락 + `<dl>` 메타 4칸 + 하퍼스 바자 인터뷰 풀쿼트
   (GQ '다정' 인용은 '문장' 섹션으로 옮겼다. 같은 말을 한 페이지에 두 번 싣지 않는다)
3. **자몽살구클럽**: `0 + 0 = ∞` 타이포 모티프. 소설 서사 소개. 사이트의 중심 섹션
4. **음반**: 두 층이다.
   - 위: `.record` 카드 5장(EP 3 + 싱글 2) — 전용 페이지가 있는 것만. 트랙칩(`.is-title`로 타이틀곡 강조)
   - 아래: `.disc-list` 두 벌 — '그 밖의 싱글' 13장, 'OST · 참여' 4편.
     페이지 없이 목록만 두고 벅스 앨범 페이지(`music.bugs.co.kr/album/<id>`)로 내보낸다.
     새 발매작은 여기에 한 줄 추가하는 게 기본이다. 전용 페이지는 서사가 있을 때만 만든다
5. **듣기**: 유튜브 파사드 6곡 + `.plat`(주력 유튜브 뮤직 + 보조 링크)
6. **문장**: 인터뷰 인용 4개. **가사는 절대 싣지 않는다** (아래 '문장' 절)
7. **무대**: 다가오는 공연 + D-day. 셋리스트는 아직 데이터가 없어 `.live-note` 한 줄뿐 (TODO)
8. **행보**: 그라디언트 타임라인. `.is-next`로 미래 일정 구분 + `.tl-flag` 예정 배지
9. **표지**: 보유 아트워크 22장 아트월. 첫 칸(최신작)만 2×2
10. **더 보기**: 링크 그리드 5칸 + 사진 1칸
11. **방명록**: 작성/수정/삭제 (비밀번호 필수), 상대시간 표시 (아래 '방명록 인라인 편집' 절)
12. **숨은 문장**: `1111` 타이핑 또는 `0+0=∞` 네 번 두드리기
13. **로고 클릭**: `index.html`로 (앨범 페이지는 헤더 왼쪽의 '← 음반'이 `#records`로 돌려보냄)

## 듣기 · 문장 · 무대 · 표지 · 숨은 문장 (2026.08.02 추가, spec.md)

### 주력 스트리밍 (`.plat`)
**유튜브 뮤직이 주력이다.** 와이즈앱 2026년 6월 국내 음악 앱 이용자 — 유튜브 뮤직 949만 ·
스포티파이 622만 · 멜론 593만 · 지니 237만 · 플로 168만. **벅스는 순위에 없다.**
그래서 `.plat`은 유튜브 뮤직만 `.btn`으로 세우고 나머지는 옆줄 보조 링크로 둔다.
- 벅스 **앨범** 링크(`/album/<id>`)는 그대로 둔다 — 듣는 곳이 아니라 디스코그래피 출처다
- 아티스트 페이지 id: 유튜브 뮤직 `music.youtube.com/channel/UCrDa_5OU-rhvXqWlPx5hgKQ` ·
  스포티파이 `5wVJpXzuKV6Xj7Yhsf2uYx` · **멜론 `3080810`** · 애플뮤직 `1613668993` · 벅스 `20155724`
- 순위가 바뀌면 근거(출처·시점)를 DECISIONS.md에 적고 나서 바꿀 것. 느낌으로 정하지 말 것

### 듣기 (`.listen` / `js/player.js`)
- **유튜브 임베드를 처음부터 박지 말 것.** 하나에 ~800KB에 추적 쿠키까지 딸려온다.
  파사드(표지 + 재생 버튼)를 깔고 누를 때만 `youtube-nocookie` iframe을 만든다
- 썸네일은 `i.ytimg.com/vi/<id>/maxresdefault.jpg`, `onerror`로 `hqdefault` 대체
- **목록에서 곡을 고르면 그 자리에서 바로 재생한다.** 파사드를 다시 깔지 않는다 —
  두 번 눌러야 했고, 휴대폰은 무대가 화면 밖이라 아무 일도 안 일어난 것처럼 보였다.
  재생 뒤 `stage.scrollIntoView({block:'nearest'})`로 무대가 화면에 들어오게 한다.
  첫 화면에 임베드를 박지 않는다는 파사드의 목적은 그대로다(누르기 전엔 표지뿐)
- **영상 id는 레포에 이미 있던 것만 쓴다.** 추측한 id는 죽어도 확인할 방법이 없다
- **스포티파이 30초 미리듣기 임베드(`.spot`)는 2026-08-03에 뺐다.** 바로 위 파사드가
  전곡 영상을 재생하고 아래 `.plat`이 다섯 플랫폼으로 내보내는 사이에서, 같은 일을
  더 나쁜 조건(30초 · 352px · 외부 iframe · 추적 쿠키)으로 한 번 더 하던 자리였다.
  **되살리지 말 것** — 스포티파이로 가는 길은 `.plat`과 푸터에 그대로 있다

### 문장 (`.words`)
- **가사는 한 줄도 싣지 않는다.** 인터뷰 발언만, 매체·연도와 원문 링크를 반드시 붙인다
- **인용을 지어내지 말 것.** 실존 인물의 말이다. 넷 전부 기사를 열어 확인했다
  (GQ 코리아 2026.04 / 위버스 매거진 ×2 / 빌보드 코리아 2026.04)

### 무대 (`.live` / `js/live.js`)
- `data-date`(D-day 계산용)와 **화면에 보이는 날짜는 손으로 맞춰야 한다.** 어긋나면 D-day만 틀린다
- 셋리스트는 **아직 없다.** 예전엔 빈 `<details>`였는데, 열어봐야 "아직 비어 있습니다"가
  나오는 서랍이라 `.live-note` 한 줄로 폈다. **확인 안 된 곡 목록을 채우지 말 것.**
  데이터가 생기면 그때 목록을 넣는다(그때는 `<details>`로 되돌려도 된다)

### 표지 (`.gallery`)
- `img/`에 있는 22장만 쓴다. **사진을 새로 긁어오지 않는다**
- `.art:first-child`만 2×2. 마지막 줄에 한 장만 남아 깨져 보이던 것을 이걸로 풀었다
- 설명은 DOM에 늘 있고 눈으로만 가린다. `@media (hover:none)`에선 처음부터 띄운다

### 숨은 문장 (`.egg` / `js/egg.js`)
- 여는 길이 **둘**이다: `1111` 타이핑 / `0+0=∞` 네 번 두드리기.
  휴대폰엔 키보드가 없어서 하나만 두면 절반은 못 찾는다. **한쪽만 남기지 말 것**
- `keydown`에서 `e.target`이 늘 Element인 건 아니다(document·window로 온다).
  `closest`를 그냥 부르면 그 자리에서 죽어 이스터에그가 통째로 먹통이 된다 → 옵셔널 체이닝 유지

### 거르기 (`.disc-filter` / `js/disco.js`)
- 목록은 HTML에 그대로 두고 `hidden`만 토글한다. **데이터를 JS 배열로 옮기지 말 것**
  (검색엔진이 목록을 못 읽고 코드만 는다)
- `[hidden]{display:none!important}`가 전역에 있다. `.record`가 `display:grid`라
  `hidden` 속성이 조용히 무시되던 걸 막는 규칙 — **지우면 거르기가 통째로 안 먹는다**
- 발매작을 추가하면 `data-kind`·`data-year`를 붙이고 **칩의 개수(`<b>`)도 같이 고칠 것**

## 질감 · 패럴랙스
- `body::after`에 SVG `feTurbulence` 그레인 한 겹. 세기는 `--grain-op`
  (밤 0.055 필름 결 / 낮 0.03 종이 결). `mix-blend-mode`는 쓰지 않는다(사파리 스크롤 성능)
- 히어로 패럴랙스는 스크롤 리스너가 `--sy`(px)만 갱신하고 레이어들이 각자 배율로 쓴다.
  리스너는 진행 막대와 **하나를 공유한다**. `prefers-reduced-motion`이면 갱신 자체를 안 한다

## 링크 미리보기 (Open Graph)
7개 페이지 전부 `<head>`의 `description` 바로 아래에 og 블록이 있다.
카톡·트위터·디스코드가 이걸 읽어 썸네일 카드를 만든다.

- **배포 주소가 `https://hanroro-eight.vercel.app`으로 하드코딩돼 있다.**
  `og:image`·`og:url`은 상대경로가 안 먹어서 전체 주소여야 한다.
  **도메인이 바뀌면 7개 파일을 전부 고쳐야 한다** (`grep -l hanroro-eight *.html`)
- 이미지는 앨범 페이지는 각자의 `img/cover-*.jpg`(512×512), 메인·방명록은
  `img/background.jpg`(2940×1852). 새 파일을 만들지 않고 있는 걸 재활용한 것
- `og:title`·`og:description`은 그 페이지의 `<title>`·`description`과 같은 값이다.
  **둘 중 하나만 고치면 미리보기와 탭 제목이 어긋난다. 같이 고칠 것**

## 작업 시 주의사항
- **색은 CSS 변수로만.** 하드코딩 hex를 새로 추가하지 말 것. 새 색이 필요하면 **두 테마 블록 모두**에 추가한다
- 색을 바꾸면 **대비를 다시 계산할 것** (본문·서브·캡션·강조 ≥4.5:1). 특히 낮 모드는 여유가 좁다
- **팔레트를 바꾸려면 근거가 있어야 한다.** 사이트 기본색은 '입춘'(밤)과 자몽살구클럽 과육(낮),
  앨범 페이지 색은 **실제 표지 이미지**에서 파생됨. 임의의 색 추가 금지
- 이미지는 전부 `img/`에만 둔다. 앨범 표지 파일명은 `cover-<data-album 값>.jpg`로 맞춘다 (CSS `--cover`가 이 규칙에 의존)
- 사진 위 글자(`.link-photo figcaption`)는 스크림이 두 테마 모두 어두우므로 **밝은 색 고정** — `var(--text)`로 바꾸지 말 것
- 입력 필드에는 `spellcheck="false"` 유지. (구 `-webkit-text-stroke:0.7px`는 Gaegu 폰트용 핵이었고 폰트 교체와 함께 제거됨 — 되살리지 말 것)
- **CSS 특정도 주의**: `.X p` 형태의 자손 셀렉터(0,1,1)가 `.클래스`(0,1,0)를 덮어쓴다. 실제로 `.tl-item p`가 `.tl-date`를 깨뜨려 `:not(.tl-date)`로 막아둠. 유사 패턴 추가 시 확인할 것
- `.gb-entry-msg`는 `white-space:pre-wrap`이라 인라인 편집 시 템플릿 리터럴 들여쓰기가 새어나옴 → `:has(.gb-edit-textarea)`로 해제해둠
- SweetAlert2 스타일은 `!important`로 덮어야 함
- `scrollbar-gutter:stable` + `scroll-padding-top`(sticky 헤더 보정) 유지
- DB 조작은 직접 SQL이 아닌 RPC 함수 사용 필수
- 세 앨범 모두 실제 발매 수록 순서로 번호를 매겨뒀다. 순서를 바꾸려면 출처를 확인할 것
- `.record`의 커버 열은 **폭을 고정**해야 한다. `auto`로 두면 `aspect-ratio:1` 정사각형 크기가 튄다
- ⚠️ **`<img width height>` 속성이 있는 그림에 `aspect-ratio`를 걸면 `height:auto`를 같이 줘야 한다.**
  `height` 속성이 presentational hint로 살아남아 높이가 `auto`가 아니게 되고, 그러면
  `aspect-ratio`는 조용히 무시된다. `width:100%`는 CSS가 덮지만 `height`는 아무도 안 덮는다.
  실제로 `.about-photo img`가 3/4(453px) 대신 976px로 서서 옆에 350px 빈 칸이 났다 (2026-08-03 수정).
  속성 자체는 지우지 말 것 — 레이아웃 시프트(CLS)를 막는 건 그 속성이다
- **좁은 화면에서 세로로만 쌓이면 그 블록만 화면 한 장이 된다.** 길이가 제각각인 목록
  여러 개를 접을 땐 grid 2열보다 **다단(`columns:2`)**이 낫다 — grid는 짧은 칸 옆이 통째로 빈다
  (`.foot-grid` ≤760px: 1062 → 709px)

## 알고 둔 한계 (고치라는 뜻이 아니라, 이미 판단한 것들)
- **좋아요 조작 가능** — 서버가 호출자를 구분하지 않는다. 중복 방지는 `localStorage`뿐.
  어뷰징이 보이면 IP 기준 rate limit(Edge Function이나 프록시)이 필요
- **잠금 악용** — 남의 글에 일부러 10번 틀리면 5분간 그 글의 수정·삭제가 막힌다. 자동 해제라 감수
- **2026-07-29 이전 방명록 6건** — cost-6 해시 + 그 시기 `password_hash`가 공개돼 있었다.
  원문 비밀번호를 몰라 재해싱 불가. **그대로 두기로 결정함**
- **메인 음반 목록의 좋아요는 읽기 전용 숫자뿐**(`.record-likes`) — `.record` 카드 전체가
  `<a>`라 안에 버튼을 넣으면 링크가 중첩된다. 누르는 건 앨범 페이지에서.
  **0이면 아예 붙이지 않는다** — '♥ 0'은 알려주는 게 없다
- **iOS 홈화면 아이콘 없음** — `favicon.svg`만 있다. 필요하면 180×180 PNG 추가

## 남은 후보 작업
- ~~메인 히어로의 '입춘' 링크가 옛 영상(`niazCi1AqqA`)~~ → 앨범 페이지와 같은
  뮤직비디오(`kIiW3XRP7bU`)로 통일했다
- **셋리스트가 비어 있다** (`.live-note` 자리). 공연 뒤 공식 채널에서 확인해 채울 것
- **공연·화보 사진이 없다** (`.gallery`). 사용 허락을 받으면 표지 아래에 사진 줄 추가
- ~~멜론 아티스트 링크는 id를 확인 못 했다~~ → `artistId=3080810` 확인해 넣었다
  (`www.melon.com/artist/timeline.htm?artistId=3080810`, `og:title="한로로"`로 대조)
- ~~〈너와 나〉 작사·작곡 크레딧 미확인~~ → 벅스 트랙 페이지(`music.bugs.co.kr/track/33992621`)에서
  확인해 `album-youandi.html` 라이너 아래에 넣었다. 다른 곡 크레딧도 같은 방법으로 얻을 수 있다
- 방명록 목록이 50건에서 잘린다 (`limit(50)`). 더 쌓이면 페이지네이션 필요
