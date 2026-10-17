# @hsuan741220/tw-address

臺灣地址解析、正規化與三碼郵遞區號查詢。TypeScript 撰寫，零執行期依賴，支援 Node.js 20 以上，提供 ESM、CommonJS 與對應型別宣告。

## 安裝

```sh
npm install @hsuan741220/tw-address
```

## 快速開始

ESM：

```js
import { normalize, parse, format, lookupZip3 } from '@hsuan741220/tw-address';

normalize('台灣 台北市大安區忠孝東路４段十二號５Ｆ');
// '臺北市大安區忠孝東路四段12號5樓'

const address = parse('１０６－００３台北市大安區忠孝東路４段１２－３號５樓之２');
// {
//   zip: '106003', zip3: '106', county: '臺北市', district: '大安區',
//   road: '忠孝東路', section: '四段', number: '12之3號',
//   floor: '5樓', room: '之2',
//   normalized: '106003臺北市大安區忠孝東路四段12之3號5樓之2',
//   valid: true, warnings: []
// }
format(address, { zip: false }); // '臺北市大安區忠孝東路四段12之3號5樓之2'
lookupZip3('台北市', '大安區'); // '106'
```

CommonJS：

```js
const { parse, lookupDistrict } = require('@hsuan741220/tw-address');
parse('臺北縣板橋市中山路一段161號').normalized;
// '新北市板橋區中山路一段161號'
lookupDistrict('600');
// [
//   { county: '嘉義市', district: '西區', zip3: '600' },
//   { county: '嘉義市', district: '東區', zip3: '600' }
// ]
```

## API 參考

所有函式同步執行，不會連線。字串參數收到非字串值時拋出 `TypeError`。查無資料時回傳 `undefined` 或空陣列。

### `normalize(input: string, options?: NormalizeOptions): string`

只正規化文字，不推測縣市或補上郵遞區號：

- Unicode NFKC 轉換全形英數字、標點；合併空白，移除中文地址與數字元件間的空白。
- 移除開頭 `臺灣`、`台灣`、`中華民國`、`Taiwan (R.O.C.)`，以及舊地址的 `臺灣省`、`台灣省`、`福建省`，也接受郵遞區號後的國名／省名前綴。路名中的 `台灣大道`、`臺灣省道` 保留。
- 行政區名稱依官方資料使用「臺」，包含臺北市、臺中市、臺南市、臺東縣、臺東市、臺西鄉、霧臺鄉；路名與建物名稱中的「台」保留。
- 段用中文數字：`3段` → `三段`。巷、弄、號、樓、室、鄰用阿拉伯數字：`二十三巷十二號五樓` → `23巷12號5樓`，支援一般、大寫與逐字中文數字。
- `5F`、`5f`、`5 樓` → `5樓`；`B1`、`地下一樓` → `地下1樓`。
- `12-3號`、`12之3號`、`12號之3` → `12之3號`；`12-1號之2` → `12之1之2號`；`5樓之二`、`5樓-2`、`5F-2` → `5樓之2`。
- 開頭 `106-003` 或 `106 - 003` → `106003`，完整保留所有郵遞區號數字。後接數字地址時保留分隔空白，例如 `106 14街1號`，避免郵遞區號與路名／門牌合併。

無法明確解析的數字（例如 `十二三號`、`零十號`）保留原文。省略的位值不推測；`一百二號` 沿用 `102號` 的轉換。

`NormalizeOptions.hyphenToZhi` 預設 `true`。設為 `false` 可保留數字元件的連字號；郵遞區號的分隔連字號仍移除。

```js
normalize('１２－３號', { hyphenToZhi: false }); // '12-3號'
```

### `parse(input: string): ParsedAddress`

先執行預設正規化，再依地址順序解析。未出現的選填欄位會省略。

| 欄位 | 型別 | 說明／範例 |
| --- | --- | --- |
| `zip` | `string?` | 輸入的 3、5 或 6 碼，例如 `106003`；不自動產生後兩／三碼 |
| `zip3` | `string?` | 輸入郵遞區號前三碼，或未提供時由已確認行政區查得 |
| `county`, `district` | `string?` | 縣市、鄉鎮市區，例如 `臺北市`、`大安區` |
| `village`, `neighborhood` | `string?` | 含後綴，例如 `光明里`、`介壽村`、`23鄰` |
| `road`, `section` | `string?` | 路／街／大道／道與段分開，例如 `忠孝東路`、`四段` |
| `lane`, `alley` | `string?` | 含巷、弄，例如 `23巷`、`5弄` |
| `number` | `string?` | 含號與附號，例如 `12之3號` |
| `floor` | `string?` | 含樓，例如 `5樓`、`地下1樓` |
| `room` | `string?` | 含室或樓後的之，例如 `501室`、`A室`、`之2`、`之2室` |
| `rest` | `string?` | 正規化後未解析的剩餘文字 |
| `normalized` | `string` | 組合後的標準字串，包含推得的行政區，保留原有郵遞區號 |
| `valid` | `boolean` | 縣市、行政區、門牌已確認，且無任何警告 |
| `warnings` | `string[]` | 不重複的警告代碼，見下表 |

`valid` 表示結構完整、三碼與行政區一致，並非可投遞證明。只有行政區、沒有門牌時為無效；村落地址可以沒有路名。

行政區唯一時會補縣市；`信義區市府路1號` 有臺北市／基隆市歧義，縣市留空並警告；`110信義區市府路1號` 則可確認臺北市。唯一郵遞區號可補行政區；`600` 只能確認嘉義市，無法決定東／西區。發生衝突時保留輸入郵遞區號與文字行政區並警告。

支援臺北縣→新北市、桃園縣→桃園市，以及臺中縣、臺南縣、高雄縣合併升格。使用明確對照表將原鄉／鎮／市改為同名區，例如 `臺北縣板橋市` → `新北市板橋區`，不任意修改其他縣市的鄉鎮市。

| 警告代碼 | 說明 |
| --- | --- |
| `EMPTY_INPUT` | 去除國名／省名前綴後沒有地址 |
| `AMBIGUOUS_DISTRICT` | 同名行政區或共用三碼無法唯一判斷 |
| `MISSING_COUNTY` / `MISSING_DISTRICT` / `MISSING_NUMBER` | 缺少縣市／行政區／門牌 |
| `UNKNOWN_COUNTY` | 出現不在資料中的縣名 |
| `UNKNOWN_DISTRICT` | 未知行政區或縣市與行政區沒有對應資料 |
| `UNKNOWN_ZIP3` | 前三碼不在資料中 |
| `INVALID_POSTAL_CODE` | 開頭疑似郵遞區號但格式／長度不支援 |
| `ZIP_DISTRICT_MISMATCH` | 三碼與縣市／行政區衝突 |
| `INVALID_COMPONENT` | 段、巷、弄、門牌、樓層、鄰、數字室號或附號為零（英數室號如 `A0室` 不受此規則限制） |
| `UNPARSED_TEXT` | 有未解析文字，包含建物註記 |

### `format(address: Readonly<AddressParts>, options?: FormatOptions): string`

依序組合郵遞區號、縣市、行政區、村里、鄰、路、段、巷、弄、號、樓、室及剩餘文字。接受部分欄位，不修改物件。自行提供的欄位須已正規化並含後綴。`address` 為 `null` 或非物件時拋出 `TypeError('address must be an object')`。

郵遞區號後若直接接數字地址，會加上分隔空白，例如 `106 14街1號`。

- 預設保留 `zip`，不加入推得的 `zip3`，所以 `format(parsed) === parsed.normalized`。
- `{ zip: false }` 省略郵遞區號。
- `{ zip: true }` 優先使用 `zip`，否則用 `zip3`。

```js
const address = parse('板橋區中山路1號');
format(address); // '新北市板橋區中山路1號'
format(address, { zip: true }); // '220新北市板橋區中山路1號'
```

### 查詢函式與型別

| 函式 | 回傳值 |
| --- | --- |
| `lookupZip3(county: string, district: string)` | `string \| undefined`；接受台／臺與支援的舊行政區 |
| `lookupDistrict(zip3: string)` | `DistrictRecord[]`，每筆含 `county`、`district`、`zip3`；只接受三碼，可用全形數字 |
| `listCounties()` | `string[]`，資料中的 22 縣市 |
| `listDistricts(county: string)` | `string[]`，該縣市的行政區名稱 |

陣列依資料順序排列，每次回傳新陣列；反查也複製物件。嘉義市東／西區共用 `600`，新竹市東／北／香山區共用 `300`，反查保留所有結果。

公開型別：`AddressParts`、`ParsedAddress`、`DistrictRecord`、`NormalizeOptions`、`FormatOptions`。

## 資料來源與授權

程式碼採 [MIT](LICENSE)，Copyright (c) 2026 neohsuan。政府資料保留原授權，並非改授 MIT。

- 提供機關：中華郵政股份有限公司。
- 資料集：[3碼郵遞區號與行政區中心點經緯度對照表，政府資料開放平臺 25489](https://data.gov.tw/dataset/25489)。
- [原始 XML 來源](https://www.post.gov.tw/post/download/1050812_%E8%A1%8C%E6%94%BF%E5%8D%80%E7%B6%93%E7%B7%AF%E5%BA%A6%28toPost%29.xml)。
- 授權：[政府資料開放授權條款－第1版](https://data.gov.tw/license)；使用及散布資料時請保留來源與授權標示。
- 快照日期 2016-08-12，共 371 筆，包含特殊郵政區域；此數字並非現行地方行政區總數。

原始檔位於 `data/sources/zip3-chunghwa-post-1050812.xml`。無依賴的 `scripts/generate-data.mjs` 解析此固定 XML 結構，保留縣市、行政區與三碼，省略座標及 TGOS 連結，產生 `src/data.generated.ts`；不連網、不補入其他資料。

```sh
npm run generate:data
```

### 官方 3+3 郵遞區號

完整 3+3 資料透過中華郵政應用系統／Web Service 提供，適用獨立使用規範，本套件不內附。請至[官方郵遞區號下載專區](https://www.post.gov.tw/post/internet/Download/index.jsp?ID=220306)，選擇「3+3郵遞區號應用系統」，或依「3+3郵遞區號查詢 Web Service 系統介接申請書」申請介接，並閱讀官方授權聲明與系統使用規範。

本套件只保留輸入的五碼／六碼並檢查前三碼，不查詢、推算或驗證後兩／三碼。範例 `106003` 不代表已通過投遞範圍查核。

## 限制

規則式中文地址解析，不提供地理編碼、道路／門牌／村里存在性查核、英文地址翻譯或完整郵遞區號查詢。資料快照不會自動更新。只解析開頭郵遞區號；尾端郵遞區號、郵政信箱、交叉路口、方向段、文字巷名與任意順序地址未支援。村里與路名可能有字面歧義，呼叫端應檢查結果。未匹配處起的文字保留於 `rest`，可能使後續元件無法解析；建物註記也會警告。若需保留原始文字與空白，請另外保存輸入。

## 開發

```sh
npm ci
npm run generate:data
npm run typecheck
npm test
npm run attw
```

測試涵蓋全部 371 筆、共用碼、各縣市地址、舊行政區、完整元件、全形、缺漏／無效輸入、資料產生可重現性與建置後以套件名稱原生 import／require。CI 使用 Node.js 20／22。參見 [CONTRIBUTING.md](CONTRIBUTING.md) 與 [CHANGELOG.md](CHANGELOG.md)。

## Related projects

- [tw-utils](https://github.com/neohsuan/tw-utils)：臺灣識別碼與日期工具。
- [tw-holidays](https://github.com/neohsuan/tw-holidays)：臺灣假日工具。
- [tw-einvoice-qr](https://github.com/neohsuan/tw-einvoice-qr)：臺灣電子發票 QR Code 工具。

## English

`@hsuan741220/tw-address` parses and normalizes Chinese Taiwan addresses and looks up three-digit postal codes. It uses strict TypeScript, has zero runtime dependencies, requires Node.js 20 or newer, and ships ESM/CJS builds with matching type declarations.

### Installation and examples

```sh
npm install @hsuan741220/tw-address
```

ESM:

```js
import { normalize, parse, format, lookupZip3, lookupDistrict, listCounties, listDistricts } from '@hsuan741220/tw-address';

normalize('Taiwan (R.O.C.) 台北市大安區忠孝東路４段十二號５Ｆ');
// '臺北市大安區忠孝東路四段12號5樓'
const address = parse('106-003台北市大安區忠孝東路4段12-3號5樓之2');
format(address); // '106003臺北市大安區忠孝東路四段12之3號5樓之2'
format(address, { zip: false }); // '臺北市大安區忠孝東路四段12之3號5樓之2'
lookupZip3('台北市', '大安區'); // '106'
lookupDistrict('600').map(({ district }) => district); // ['西區', '東區']
listCounties().length; // 22
listDistricts('臺北市').includes('大安區'); // true
```

CommonJS:

```js
const { parse, format } = require('@hsuan741220/tw-address');
const address = parse('臺北縣板橋市中山路一段161號');
format(address, { zip: true }); // '220新北市板橋區中山路一段161號'
```

### API reference

All functions are synchronous and make no network requests. Non-string values passed to string parameters throw `TypeError`.

**`normalize(input: string, options?: NormalizeOptions): string`** applies Unicode NFKC to full-width digits, Latin letters and punctuation, collapses whitespace, and removes spaces between Chinese address tokens and numerals. It strips leading `臺灣`, `台灣`, `中華民國`, `Taiwan (R.O.C.)` and legacy province prefixes `臺灣省`, `台灣省`, `福建省`, including after a leading ZIP. Road names such as `台灣大道` and `臺灣省道` are preserved. Administrative 台 spellings become 臺; road and building names retain their 台 spelling. No county or postal code is inferred.

Sections use Chinese numerals (`3段` → `三段`); lanes, alleys, house numbers, floors, rooms and neighborhoods use Arabic digits (`二十三巷十二號五樓` → `23巷12號5樓`). Common financial and positional Chinese numerals are supported. Malformed numerals such as `十二三號` and `零十號` are preserved. Omitted place values are not inferred; `一百二號` retains its existing conversion to `102號`.

`5F`, `5f` and `5 樓` become `5樓`; `B1` and `地下一樓` become `地下1樓`. `12-3號` and `12號之3` become `12之3號`; `12-1號之2` becomes `12之1之2號`. `5樓之二`, `5樓-2` and `5F-2` become `5樓之2`. Set `{ hyphenToZhi: false }` to retain numeric component hyphens. Postal separators are always removed (`106-003` or `106 - 003` → `106003`), preserving every digit. A space after a ZIP is retained before a numeric address, as in `106 14街1號`, to keep the postal digits separate from the road or house number.

**`parse(input: string): ParsedAddress`** first normalizes with default options, then extracts components in postal order. Missing optional fields are omitted:

| Field | Type | Meaning / example |
| --- | --- | --- |
| `zip` | `string?` | Input ZIP, exactly 3, 5 or 6 digits; no suffix is invented |
| `zip3` | `string?` | First three input ZIP digits, or lookup from a recognized county/district when ZIP is absent |
| `county`, `district` | `string?` | County/city and township/district, e.g. `臺北市`, `大安區` |
| `village`, `neighborhood` | `string?` | Include suffixes, e.g. `光明里`, `介壽村`, `23鄰` |
| `road`, `section` | `string?` | Separate road and section, e.g. `忠孝東路`, `四段`; road endings include 路/街/大道/道 |
| `lane`, `alley` | `string?` | Include suffixes, e.g. `23巷`, `5弄` |
| `number` | `string?` | House number including 號 and subnumber, e.g. `12之3號` |
| `floor` | `string?` | Floor including 樓, e.g. `5樓`, `地下1樓` |
| `room` | `string?` | Room with 室 or subunit after floor: `501室`, `A室`, `之2`, `之2室` |
| `rest` | `string?` | Unparsed text after normalization |
| `normalized` | `string` | Canonical string including inferred administration and preserving the input ZIP |
| `valid` | `boolean` | Recognized county, district and house number, with no warnings |
| `warnings` | `string[]` | Unique warning codes below |

Validity means structural completeness and three-digit administrative consistency, not deliverability. District-only input lacks a house number and is incomplete. Rural village addresses can be valid without a road.

A unique district supplies its county. Ambiguous `信義區` retains an undefined county and warns; prefix `110` identifies Taipei, while `201` identifies Keelung. A unique ZIP can supply administration, but `600` identifies only Chiayi City, leaving the district unresolved. Conflicting explicit administration and postal digits are retained and reported.

Legacy aliases cover Taipei County → New Taipei City, Taoyuan County → Taoyuan City, and the Taichung, Tainan and Kaohsiung county mergers. An explicit table converts former 鄉/鎮/市 to same-base 區 within those five upgrades, such as `臺北縣板橋市` → `新北市板橋區`. Other counties' townships and county-administered cities are preserved.

| Warning | Meaning |
| --- | --- |
| `EMPTY_INPUT` | No address remains after stripping country/province prefixes |
| `AMBIGUOUS_DISTRICT` | Same-name districts or a shared code cannot be resolved |
| `MISSING_COUNTY` / `MISSING_DISTRICT` / `MISSING_NUMBER` | Required structural component is missing |
| `UNKNOWN_COUNTY` | An unrecognized county name was encountered |
| `UNKNOWN_DISTRICT` | Unknown district or unsupported county/district combination |
| `UNKNOWN_ZIP3` | Prefix is absent from the bundled table |
| `INVALID_POSTAL_CODE` | An apparent leading ZIP has unsupported length or format |
| `ZIP_DISTRICT_MISMATCH` | ZIP prefix conflicts with the county or district |
| `INVALID_COMPONENT` | Zero section, lane, alley, house number, floor, neighborhood, numeric room or subnumber; alphanumeric rooms such as `A0室` are exempt |
| `UNPARSED_TEXT` | Remaining text, including building annotations, could not be parsed |

**`format(address: Readonly<AddressParts>, options?: FormatOptions): string`** joins normalized components in postal order and retains `rest`. It accepts partial objects without mutation; manually supplied components must already include suffixes. A null or non-object `address` throws `TypeError('address must be an object')`. The default preserves `zip` only, so `format(parsed) === parsed.normalized`. `{ zip: false }` omits ZIP; `{ zip: true }` uses `zip`, falling back to inferred `zip3`.

A ZIP directly followed by a numeric address is separated with a space, as in `106 14街1號`.

**Lookup functions:**

| Function | Return value |
| --- | --- |
| `lookupZip3(county: string, district: string)` | `string \| undefined`; accepts 台 spellings and supported legacy aliases |
| `lookupDistrict(zip3: string)` | `DistrictRecord[]` with `county`, `district`, `zip3`; exactly three digits, including full-width digits |
| `listCounties()` | `string[]`, the 22 counties/cities in source order |
| `listDistricts(county: string)` | `string[]`, the county's district names in source order |

Unknown lookups return `undefined` or `[]`. Arrays and lookup records are fresh copies. Chiayi City's East and West districts share `600`; Hsinchu City's East, North and Xiangshan districts share `300`. Reverse lookup retains all matches.

Exported types: `AddressParts`, `ParsedAddress`, `DistrictRecord`, `NormalizeOptions`, `FormatOptions`.

### Data, licensing and official 3+3 codes

Code is [MIT licensed](LICENSE), Copyright (c) 2026 neohsuan. Postal data remains under the separate [Government Data Open License v1.0](https://data.gov.tw/license). Retain its source and license attribution when reusing or redistributing it.

The source is Chunghwa Post's [three-digit postal code and district center coordinates table, data.gov.tw dataset 25489](https://data.gov.tw/dataset/25489), specifically the [2016-08-12 XML snapshot](https://www.post.gov.tw/post/download/1050812_%E8%A1%8C%E6%94%BF%E5%8D%80%E7%B6%93%E7%B7%AF%E5%BA%A6%28toPost%29.xml). The original is retained at `data/sources/zip3-chunghwa-post-1050812.xml`. Dependency-free `scripts/generate-data.mjs` converts its fixed XML schema to `src/data.generated.ts`, retaining county, district and three-digit ZIP, and omitting coordinates and TGOS links. All 371 source records remain, including special postal areas; this is not a count of current local administrative districts. Regenerate with `npm run generate:data`; no network is needed.

The complete 3+3 dataset is distributed through Chunghwa Post's application system and Web Service under separate usage rules and is not bundled. Visit the [official download page](https://www.post.gov.tw/post/internet/Download/index.jsp?ID=220306), choose “3+3郵遞區號應用系統”, or apply using the “3+3郵遞區號查詢 Web Service 系統介接申請書”. Read the authorization statement and system usage rules before integration.

The library preserves supplied legacy five-digit and six-digit postal codes and checks only the first three digits. It does not retrieve, calculate or validate the final two/three digits. Example `106003` does not assert a verified delivery range.

### Limitations

This is a rule-based Chinese address parser. It does not geocode, verify roads/house numbers/villages, translate English addresses, or resolve full postal codes. The snapshot does not update automatically. Postal codes are recognized only at the beginning. Postal boxes, intersections, directional sections, textual lane names and arbitrary component ordering are unsupported. Village and road names can be lexically ambiguous; callers should review results. Text from an unmatched position stays in `rest` and can prevent later component parsing; building notes also produce warnings. Save the original input separately if exact spelling and spacing matter.

### Development

```sh
npm ci
npm run generate:data
npm run typecheck
npm test
npm run attw
```

Tests cover all 371 records, shared codes, addresses across counties, legacy upgrades, every component, full-width inputs, missing/invalid values, reproducible generation, and native ESM/CJS self-reference imports of the built package. CI runs on Node.js 20 and 22. See [CONTRIBUTING.md](CONTRIBUTING.md) and [CHANGELOG.md](CHANGELOG.md).

### Related projects

- [tw-utils](https://github.com/neohsuan/tw-utils): Taiwan identifier and date utilities.
- [tw-holidays](https://github.com/neohsuan/tw-holidays): Taiwan holiday utilities.
- [tw-einvoice-qr](https://github.com/neohsuan/tw-einvoice-qr): Taiwan electronic invoice QR utilities.
