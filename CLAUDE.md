# CLAUDE.md

## 프로젝트 개요
한로로(HANRORO) 비공식 팬사이트. 정적 HTML/CSS/JS + Supabase 백엔드.

## 파일 구조
```
hanroro/
├── index.html          메인 (히어로, 프로필, 자몽살구클럽, 음반, 행보, 링크, CTA, 푸터)
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
├── js/guestbook.js     방명록 로직 (Supabase CRUD, 비밀번호 검증, 모달 설정)
├── img/                모든 이미지는 여기에만 둔다
│   ├── background.jpg  히어로 배경
│   ├── profile.jpg     프로필 사진
│   ├── card.jpg        링크 그리드 사진
│   └── cover-{ep1,ep2,ep3,single,youandi}.jpg  실제 앨범 표지 (파일명 = data-album 값)
└── .claude/skills/frontend-design/
```

## 기술 스택
- **프론트**: 순수 HTML/CSS/JS (빌드 도구 없음)
- **백엔드**: Supabase (PostgreSQL + REST API)
- **라이브러리** (CDN):
  - `@supabase/supabase-js@2` — DB 클라이언트
  - `sweetalert2@11` — alert/confirm 모달
  - `dayjs@1` + relativeTime + ko 로케일 — 시간 포맷팅
  - `aos@2.3.1` — 스크롤 애니메이션 (reduced-motion 시 `disable` 콜백으로 끔)

## Supabase 설정
- **Project ID**: `avsnujrdogkxvhtelrzx`
- **Region**: ap-northeast-1
- **API URL**: `https://avsnujrdogkxvhtelrzx.supabase.co`
- **Anon Key**: `js/guestbook.js` 상단에 하드코딩 (공개용, RLS로 보호)

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
- **비밀번호**: pgcrypto `crypt()` + `gen_salt('bf', 10)`. **cost를 10 미만으로 낮추지 말 것**
  (기본값 6은 오프라인 크래킹에 너무 약하다). pgcrypto는 `extensions` 스키마에 있다
- ⚠️ **2026-07-29 이전 작성 6건은 cost-6 해시**이고, 그 시기에 `password_hash`가 REST로
  공개돼 있었다. 유출됐다면 그 글의 수정·삭제 권한이 남에게 있을 수 있다. 재해싱은 원문
  비밀번호를 모르므로 불가 — 알고도 그대로 두기로 한 결정이다. 그 6건에 이상한 수정/삭제가
  보이면 원인은 이것
- **XSS 방지**: `escapeHtml()`로 모든 사용자 입력 이스케이프

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
| `--header-bg` `--hero-veil` `--hero-filter` `--photo-scrim` `--scrim` `--shadow-lift` | 테마별 | | 합성 값 |

**`--brand-1` `#e05a7a` / `--brand-2` `#f0a45c` / `--btn-ink` `#16121a`** — 테마 무관 고정
(앨범 페이지에서만 표지색으로 덮인다). 자몽·살구 원색은 버튼·배지·그라디언트 선 등 **채움에만** 쓰고,
그 위의 글자는 `--btn-ink`를 쓴다. 밝은 배경에서 대비가 안 나오므로 **원색을 글자색으로 쓰지 말 것**
(글자에는 `--grapefruit`/`--apricot`을 쓴다. 이 둘은 테마별로 대비를 맞춰둔 값이다).

- **폰트**: `--serif` Gowun Batang(제목·인용) / `--sans` IBM Plex Sans KR(본문, 300) / `--mono` IBM Plex Mono(날짜·라벨·eyebrow)
- **시그니처**: `.manuscript` — 46px 원고지 칸 그리드. 순수 CSS, 이미지 없음. 히어로와 자몽살구클럽에만
- **배지**: `.badge` + `.badge-solid|ghost` + 위치 `.badge-tl|br|tr|hero-badge`, 지연 `.badge-float-2|3`.
  `transform`이 아니라 **`translate` 프로퍼티**로 떠오르게 했다 — `transform:rotate()`로 준 기울기와 겹치지 않게 하려는 것
- **레이아웃 유틸**: `.band` `.wrap`(1120) `.wrap-narrow`(720) `.eyebrow` `.band-title` `.band-sub`
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

### 메인 CSS와 부딪히는 지점 (중요)
`album.css`는 `style.css` **다음에** 로드되고, `index.html`은 두 파일을 다 읽는다.
그래서 **같은 클래스 이름을 절대 쓰면 안 된다.**
- 실제로 터졌던 것: 앨범의 타이틀 칩을 `.tl-flag`로 뒀더니 **메인 행보의 '예정' 배지**를
  덮어버렸다 → `.trk-flag`로 개명. 새 클래스를 추가할 땐 `style.css`에 같은 이름이 있는지 먼저 볼 것
- `<header class="ah">`는 요소 셀렉터 `header{}`와 760px 미디어쿼리(`flex-direction:column`)를
  맞는다. `.ah`가 `flex-direction:row`를 **명시**해 되돌려 놓았다

## 모달 (SweetAlert2)
`js/guestbook.js`의 **`SWAL` 상수**를 스프레드해서 쓴다 — `Swal.fire({ ...SWAL, ... })`.
- `buttonsStyling:false` + `customClass`(`.hr-swal*`)로 **CSS가 전권을 갖는다**. `!important` 최소화됨
- **`confirmButtonColor` 같은 인라인 색을 넣지 말 것** — 인라인 색은 테마를 따라가지 못해 모달만 옛 색으로 남는다
- 성공 알림은 `toastSuccess()` (우상단 토스트), 오류는 `alertError()`
- 삭제 확인은 작성자 이름을 보여주고 `focusCancel` + `reverseButtons`로 안전 쪽에 포커스

## 주요 기능
1. **히어로**: 배경사진 + 먹밤 베일 + 원고지 그리드. 이름 '로로'만 여명 그라디언트(길 로 路 의미)
2. **프로필**: 사진 + 약력 3단락 + `<dl>` 메타 4칸 + GQ 인터뷰 풀쿼트
3. **자몽살구클럽**: `0 + 0 = ∞` 타이포 모티프. 소설 서사 소개. 사이트의 중심 섹션
4. **음반**: EP 3장 + 데뷔 싱글. 트랙칩(`.is-title`로 타이틀곡 강조)
5. **행보**: 그라디언트 타임라인. `.is-next`로 미래 일정 구분 + `.tl-flag` 예정 배지
6. **더 보기**: 링크 그리드 5칸 + 사진 1칸
7. **방명록**: 작성/수정/삭제 (비밀번호 필수), 상대시간 표시
8. **로고 클릭**: `index.html`로 (앨범 페이지는 헤더 왼쪽의 '← 음반'이 `#records`로 돌려보냄)

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
