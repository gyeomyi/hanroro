# PROGRESS

spec.md 실행 기록. **새 세션은 CLAUDE.md → 이 파일 → DECISIONS.md 순으로 읽고 이어받을 것.**

## 지금까지 한 것
- P0 기준점 커밋 (`c591c65`) — 싱글·OST 표지 17장 + 메인 디스코 목록 확장
- P0 현황 평가 → DECISIONS.md에 유지/개선/폐기 기록
- P1 그레인·히어로 패럴랙스 (`810aa0e`)
- P2 음반 거르기 — 종류×연도 칩. 헤드리스 자체검사 11항목 통과

## 지금 하는 것
- P2 디스코그래피 익스플로러

## 남은 것 (순서대로)
| # | 작업 | 상태 |
|---|------|------|
| P0 | 레포 파악 · 유지/개선/폐기 판단 · 문서 생성 | ✅ |
| P1 | 필름 그레인/종이 질감 레이어 + 히어로 재연출(이륙 직전) | ✅ |
| P2 | 디스코그래피 익스플로러 — 필터(EP/싱글/OST/연도) + 정렬 | ✅ |
| P3 | Listen 섹션 — YouTube 파사드 임베드 + 스트리밍 링크 | ⬜ |
| P4 | 문장 섹션 — 짧은 인용 + 출처 표기 (가사 전문 금지) | ⬜ |
| P5 | Live/Schedule — 예정 공연 + 셋리스트 구조 (데이터 없으면 TODO) | ⬜ |
| P6 | Gallery — 보유 에셋 기반 비주얼 월 (스크래핑 금지) | ⬜ |
| P7 | 이스터에그 — 1111 / 0+0=∞ | ⬜ |
| P8 | 최종 감사 — 접근성·대비·반응형·OG·Lighthouse·헤드리스 렌더 검증 | ⬜ |
| P9 | README·CLAUDE.md 갱신 + 최종 보고 | ⬜ |

## 재개 방법
```bash
python -m http.server 8000 --directory .
chrome --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1280,2000 --virtual-time-budget=6000 \
  --screenshot=out.png "http://localhost:8000/index.html"
```
⚠️ `file://`로 열면 AOS가 안 돌아 화면이 통째로 빈다.
