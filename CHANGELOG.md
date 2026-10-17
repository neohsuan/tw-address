# Changelog

## 1.0.0 - 2026-10-17

- 新增臺灣中文地址正規化、元件解析、格式化與明確警告。
- 支援全形輸入、台／臺行政區、中文數字、巷弄附號、樓層、地下樓與舊行政區升格對照。
- 由中華郵政官方 XML 產生全部 371 筆三碼資料，保留共用碼的一對多關係。
- 保留輸入的三碼、五碼、六碼郵遞區號並檢查前三碼，不內附完整 3+3 資料。
- 提供零執行期依賴的 ESM／CJS 建置、型別宣告、雙語文件與 Node.js 20／22 CI。

### English

- Add Chinese Taiwan address normalization, parsing, formatting and explicit warnings.
- Support full-width input, administrative aliases, Chinese numerals, subnumbers, floors, basements and legacy municipal upgrades.
- Generate all 371 official three-digit records, retaining shared-code mappings.
- Preserve supplied three-, five- and six-digit postal codes and check their first three digits without bundling the full 3+3 dataset.
- Ship zero-runtime-dependency ESM/CJS builds, declarations, bilingual documentation and Node.js 20/22 CI.
