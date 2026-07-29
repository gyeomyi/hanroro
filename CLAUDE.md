# CLAUDE.md

## 프로젝트 개요
한로로(HANRORO) 비공식 팬사이트. 정적 HTML/CSS/JS + Supabase 백엔드.

## 파일 구조
```
hanroro/
├── index.html          메인 (히어로, 프로필, 자몽살구클럽, 음반, 행보, 링크, CTA, 푸터)
├── guestbook.html      방명록 (폼 + 목록)
├── css/style.css       공통 스타일 (먹밤 팔레트, CSS 변수, 반응형 3단계)
├── js/guestbook.js     방명록 로직 (Supabase CRUD, 비밀번호 검증)
├── background.jpg      히어로 배경
├── profile.jpg         프로필 사진
├── card.jpg            링크 그리드 사진
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
- **RLS**: 활성화. SELECT만 공개 (password_hash 컬럼 제외)
- **직접 INSERT/UPDATE/DELETE**: anon 역할에서 차단
- **RPC 함수** (security definer)로만 데이터 조작:
  - `sign_guestbook(p_name, p_message, p_password)` — 작성 (bcrypt 해싱)
  - `edit_guestbook(p_id, p_password, p_message)` — 수정 (비밀번호 검증)
  - `remove_guestbook(p_id, p_password)` — 삭제 (비밀번호 검증)
- **비밀번호**: pgcrypto `crypt()` + `gen_salt('bf')`, 클라이언트에 노출 안 됨
- **XSS 방지**: `escapeHtml()`로 모든 사용자 입력 이스케이프

## 디자인 컨셉 — "쓰는 사람"
한로로는 **가사보다 산문을 먼저 쓰는 국문학도**다. 3집 〈자몽살구클럽〉은 동명 소설과
세계관을 공유한다. 그래서 이 사이트는 "가수 팬페이지"가 아니라 **한 권의 책**으로 설계됐다.
카피·구조·타이포 결정은 전부 이 논지에서 파생된다.

팔레트 근거는 데뷔곡 **'입춘'** — 겨울 끝, 아직 어두운데 봄이라 부르는 절기.
먹밤 바탕 위로 자몽(루비)·살구(앰버)의 여명이 트는 구조.

## 디자인 시스템 (CSS 변수, `:root`)
| 변수 | 값 | 용도 |
|------|-----|------|
| `--ink` | `#13141b` | 먹밤 — 기본 배경 |
| `--ink-2` | `#1a1b25` | 떠오른 표면 (club, activity, cta, 입력창) |
| `--ink-3` | `#22232f` | 카드 호버 / 포커스 표면 |
| `--paper` | `#f3ede3` | 종이빛 — 본문 텍스트 |
| `--paper-dim` | `#a8a3b2` | 서브 텍스트 |
| `--paper-far` | `#6f6b7a` | 캡션 / 메타 |
| `--grapefruit` | `#e05a7a` | 자몽 — eyebrow, 강조, 예정 플래그 |
| `--apricot` | `#f0a45c` | 살구 — 호버, 링크 활성 |
| `--line` / `--line-soft` | paper 13% / 7% | 보더 / 원고지 칸 |

- **폰트**: `--serif` Gowun Batang(제목·인용, 문학성) / `--sans` IBM Plex Sans KR(본문, 300 기본) / `--mono` IBM Plex Mono(날짜·라벨·eyebrow)
- **시그니처**: `.manuscript` — 46px 원고지 칸 그리드. 순수 CSS(repeating-linear-gradient), 이미지 없음. 히어로와 자몽살구클럽 섹션에만 사용
- **레이아웃 유틸**: `.band`(섹션 패딩) `.wrap`(1120px) `.wrap-narrow`(720px) `.eyebrow` `.band-title` `.band-sub`
- **반응형**: 900px(about 1단, record 2열), 760px(헤더 세로 스택), 480px(버튼 full-width)
- **접근성**: `:focus-visible` 살구색 아웃라인, `prefers-reduced-motion` 시 전체 애니메이션·AOS 무력화

## 주요 기능
1. **히어로**: 배경사진 + 먹밤 베일 + 원고지 그리드. 이름 '로로'만 여명 그라디언트(길 로 路 의미)
2. **프로필**: 사진 + 약력 3단락 + `<dl>` 메타 4칸 + GQ 인터뷰 풀쿼트
3. **자몽살구클럽**: `0 + 0 = ∞` 타이포 모티프. 소설 서사 소개. 사이트의 중심 섹션
4. **음반**: EP 3장 + 데뷔 싱글. 트랙칩(`.is-title`로 타이틀곡 강조)
5. **행보**: 그라디언트 타임라인. `.is-next`로 미래 일정 구분 + `.tl-flag` 예정 배지
6. **더 보기**: 링크 그리드 5칸 + 사진 1칸
7. **방명록**: 작성/수정/삭제 (비밀번호 필수), 상대시간 표시
8. **로고 클릭**: 양쪽 페이지 모두 `index.html`로 (새로고침되어 맨 위)

## 작업 시 주의사항
- **색·폰트는 CSS 변수로만 조정.** 하드코딩 hex를 새로 추가하지 말 것 (`js/guestbook.js`의 `ACCENT`/`ACCENT_MUTED`는 SweetAlert 인라인 옵션용 예외 — 팔레트 바꾸면 여기도 같이 수정)
- **팔레트를 바꾸려면 근거가 있어야 한다.** 현재 색은 '입춘'과 3집 제목에서 파생됨. 임의의 색 추가 금지
- 입력 필드에는 `spellcheck="false"` 유지. (구 `-webkit-text-stroke:0.7px`는 Gaegu 폰트용 핵이었고 폰트 교체와 함께 제거됨 — 되살리지 말 것)
- **CSS 특정도 주의**: `.X p` 형태의 자손 셀렉터(0,1,1)가 `.클래스`(0,1,0)를 덮어쓴다. 실제로 `.tl-item p`가 `.tl-date`를 깨뜨려 `:not(.tl-date)`로 막아둠. 유사 패턴 추가 시 확인할 것
- `.gb-entry-msg`는 `white-space:pre-wrap`이라 인라인 편집 시 템플릿 리터럴 들여쓰기가 새어나옴 → `:has(.gb-edit-textarea)`로 해제해둠
- SweetAlert2 스타일은 `!important`로 덮어야 함
- `scrollbar-gutter:stable` + `scroll-padding-top`(sticky 헤더 보정) 유지
- DB 조작은 직접 SQL이 아닌 RPC 함수 사용 필수
- 트랙리스트에 **번호를 매기지 말 것** — 3집 수록 순서는 확인된 출처가 없어 의도적으로 순서 없이 나열함
