# 貢獻指南 / Contributing

請使用 Node.js 20 以上與 npm。在提交修改前執行：

```sh
npm ci
npm run generate:data
npm run typecheck
npm test
npm run attw
```

測試會先建立 ESM、CJS 與型別宣告，再執行 Vitest，包含以套件名稱載入的檢查。attw 會在本機打包並檢查型別解析，不會發布套件。CI 使用 Node.js 20 與 22。

請附上能重現問題的測試，包含輸入、預期元件、正規化結果與警告。使用公開機關或虛構地址，避免提交私人住址。公共 API、警告或支援範圍有變更時，請同步更新 README 的中英文內容與 CHANGELOG。維持零執行期依賴與嚴格 TypeScript（包含 noUncheckedIndexedAccess）；保留無法辨識的文字，回報無法消除的歧義。

不要手動修改 src/data.generated.ts。請從 data/sources/zip3-chunghwa-post-1050812.xml 執行產生器，確認全部 371 筆與共用三碼資料完整。若提議更換官方快照，請提供來源、日期、授權及差異，同時調整產生器筆數檢查、測試與文件。

保留政府資料開放授權條款第1版的來源與授權標示。不要提交完整 3+3 資料；請依中華郵政獨立使用規範取得。程式碼貢獻採本專案 MIT 授權，政府資料保留原授權。

## English

Use Node.js 20 or newer and npm. Run the following before submitting changes:

```sh
npm ci
npm run generate:data
npm run typecheck
npm test
npm run attw
```

Tests build ESM/CJS artifacts and declarations before Vitest, including package-name self-reference checks. attw creates a local package and checks type resolution; it does not publish. CI runs on Node.js 20 and 22.

Include regression cases with input, expected components, canonical strings and warning codes. Prefer public institutional or invented addresses; do not submit private residential addresses. Update both README languages and the changelog when changing the API, warnings or supported grammar. Keep zero runtime dependencies and strict TypeScript, including noUncheckedIndexedAccess. Preserve unmatched text and report unresolved administrative ambiguity.

Do not edit src/data.generated.ts by hand. Regenerate from the checked-in XML and verify all 371 records and shared-code mappings. A snapshot replacement should identify the official source, date, license and differences, and update generator count checks, tests and documentation together. Retain Government Data Open License v1.0 attribution. Do not submit the complete 3+3 dataset; obtain it through Chunghwa Post under its separate rules. Code contributions use MIT; government data retains its own license.
