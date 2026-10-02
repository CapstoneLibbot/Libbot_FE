# LiBot FE

> Tài liệu này ghi lại cấu trúc và hành vi đang có trong mã nguồn hiện tại. Đây là frontend prototype: dữ liệu nghiệp vụ chủ yếu là mock data, chưa kết nối backend và chưa có lưu trữ bền vững. Khi triển khai tiếp, hãy xem code là nguồn sự thật nếu tài liệu và hành vi thực tế khác nhau.

## 1. Tổng quan

LiBot FE là giao diện quản lý robot thư viện, được xây dựng bằng React và TypeScript. Ứng dụng hiện có khung điều hướng chung, màn danh sách bản đồ, màn chi tiết bản đồ tương tác, và các màn danh sách/chi tiết Area, Aisle, Shelf. Những mục nghiệp vụ khác đã có route nhưng hiện chỉ hiển thị trang placeholder.

Các luồng dữ liệu hiện có:

- Dữ liệu Area, Aisle, Shelf, endpoint group và một phần cấu hình bản đồ nằm trong `src/lib/mapData.ts` hoặc dữ liệu mẫu khai báo ngay trong trang.
- Raster bản đồ và metadata YAML là file tĩnh trong `public/maps/`.
- Tạo endpoint/zone trên màn bản đồ chỉ cập nhật React state trong phiên hiện tại; tải lại trang sẽ mất dữ liệu.
- Không có API client, xác thực, global state library, test script hoặc persistence layer được khai báo trong project hiện tại.

## 2. Công nghệ và thư viện

| Công nghệ | Vai trò |
| --- | --- |
| React 19, React DOM | Xây dựng giao diện component |
| TypeScript 6 | Kiểu tĩnh cho ứng dụng |
| Vite 8 | Dev server và build |
| React Router 7 (`react-router`) | Điều hướng phía client, route params, link |
| Tailwind CSS 4, `@tailwindcss/vite` | Utility CSS và theme tokens |
| Lucide React | Icon |
| `clsx`, `tailwind-merge` | Ghép class có điều kiện; helper `cn` ở `src/lib/utils.ts` |
| `js-yaml` | Đọc cấu hình YAML của map |
| `@fontsource/inter` | Font Inter (được khai báo dependency; style hiện tham chiếu Inter) |

Các cấu hình đáng chú ý:

- Alias `@` trỏ tới `src/`, dùng được như `@/lib/mapData`.
- `src/index.css` khai báo CSS variables cho màu/theme và import Tailwind.
- `components.json` khai báo alias dự kiến cho cấu trúc kiểu shadcn/ui; hiện trong `src/components/` chưa có thư mục `ui`.
- TypeScript bật `noUnusedLocals` và `noUnusedParameters`; hãy giữ import/biến/hàm không dùng ở mức tối thiểu.

## 3. Cấu trúc thư mục

```text
.
├── public/
│   └── maps/
│       ├── floor1_library_v1.yaml
│       └── floor1_library_v1.pgm
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── assets/
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   └── map/
│   │       ├── MapDetailPanel.tsx
│   │       └── MapViewer.tsx
│   ├── hooks/                 # Hiện chưa có hook riêng
│   ├── lib/
│   │   ├── mapData.ts         # Mock data và quan hệ map entities
│   │   └── utils.ts           # cn(...classes)
│   ├── pages/
│   │   ├── AreaDetail.tsx
│   │   ├── aisles/AisleDetail.tsx
│   │   ├── floors/FloorDetail.tsx  # File hiện rỗng
│   │   ├── maps/ListMap.tsx
│   │   ├── maps/MapDetail.tsx
│   │   └── shelves/ShelfDetail.tsx
│   ├── router/index.tsx
│   └── types/map.ts
├── components.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 4. Khởi chạy và kiểm tra

Cần cài Node.js tương thích với phiên bản Vite đang dùng, sau đó chạy:

```bash
npm install
npm run dev
```

Các lệnh project:

```bash
npm run build      # tsc && vite build
npm run preview    # chạy thử bản build
```

Hiện không có lệnh test hoặc lint trong `package.json`.

## 5. Khởi tạo ứng dụng và layout

Luồng khởi chạy:

1. `index.html` tạo phần tử `#root` và nạp `/src/main.tsx`.
2. `src/main.tsx` import CSS global, tạo React root, bọc ứng dụng trong `StrictMode` và render `AppRouter`.
3. `src/router/index.tsx` tạo `BrowserRouter`, khai báo routes và layout.
4. `AppLayout` hiển thị `Sidebar` cố định bên trái và `Outlet` cho nội dung route.
5. Route không khớp được redirect về `/`.

`src/App.tsx` cũng trả về `AppRouter`, nhưng entry hiện tại (`main.tsx`) import trực tiếp router. Khi thay đổi bootstrap, kiểm tra để không bọc router hai lần.

## 6. Routes và tình trạng trang

| URL | Component | Tình trạng và hành vi |
| --- | --- | --- |
| `/` | `PlaceholderPage` | Overview chưa triển khai |
| `/maps` | `ListMap` | Danh sách mock, tìm kiếm theo ID/tên, lọc status/version; click dòng mở chi tiết |
| `/maps/:id` | `MapDetail` | Canvas map, xem endpoint/zone và tạo mới trong state cục bộ |
| `/areas` | `AreaDetail` | Danh sách Area mock |
| `/areas/:id` | `AreaDetail` | Chi tiết theo ID; không tìm thấy thì có thông báo và link quay lại |
| `/floors/:id` | `PlaceholderPage` | Chưa dùng `FloorDetail.tsx` (file rỗng) |
| `/aisles/:id` | `AisleDetail` | Chi tiết Aisle; component cũng có nhánh danh sách nhưng route danh sách `/aisles` chưa khai báo |
| `/shelves/:id` | `ShelfDetail` | Chi tiết Shelf; component cũng có nhánh danh sách nhưng route danh sách `/shelves` chưa khai báo |
| `/workflows` | `WorkflowList` | Danh sách workflow mock gồm ID, tên, trạng thái; hỗ trợ tìm kiếm, lọc trạng thái và tạo mới |
| `/workflows/create` | `WorkflowCreate` | Tạo workflow cùng task/step theo thứ tự và StepType; chỉ lưu định nghĩa, chưa gán tham số runtime; lưu mock trong `localStorage` |
| `/workflows/:id` | `WorkflowDetail` | Xem thông tin workflow cùng danh sách task/step theo thứ tự; không hiển thị tham số runtime |
| `/tasks`, `/iii-row`, `/book`, `/inventory`, `/inventory-results`, `/alerts`, `/history`, `/reports`, `/settings` | `PlaceholderPage` | Chưa triển khai nghiệp vụ |

Sidebar được khai báo riêng trong `src/components/layout/Sidebar.tsx`. Mục Shelf hiện trỏ tới `/shelf`, trong khi route chi tiết đang là `/shelves/:id`; `/shelf` hiện không khớp route và sẽ redirect về `/`. Khi làm tiếp Shelf, cần thống nhất URL và cập nhật cả Sidebar lẫn router.

## 7. Luồng nghiệp vụ đã có

### 7.1. Danh sách bản đồ

`src/pages/maps/ListMap.tsx` giữ danh sách `sampleMaps` ngay trong file. Các state tìm kiếm, status và version được lọc bằng `useMemo`. Nút Clear xóa các điều kiện lọc. Click một dòng điều hướng đến `/maps/:id`.

Các giới hạn hiện tại: Create Map và Filter là nút giao diện chưa có hành động; phân trang chỉ là hiển thị tĩnh một trang; danh sách không tải từ API. Màn chi tiết hiện cũng chỉ dựng một `sampleMap`, không truy vấn map theo ID thực.

### 7.2. Chi tiết bản đồ, endpoint và zone

`src/pages/maps/MapDetail.tsx` là nơi sở hữu state nghiệp vụ cho màn map:

- Tab `detail`, `endpoint`, `zone` điều khiển nội dung panel và lớp overlay trên canvas.
- Endpoint ban đầu được tạo từ `endpointSeeds`; endpoint group được gắn dựa trên `initialEndpointGroupMembers`.
- Có thể lọc endpoint theo group, chọn endpoint/zone từ danh sách hoặc trên map.
- Ở tab Endpoint, double-click vị trí trống mở form tạo endpoint với tọa độ thế giới được điền sẵn. Nút Create mở form với tọa độ mặc định `(0, 0)`.
- Submit form thêm endpoint vào state, chọn endpoint vừa tạo và cập nhật marker trên canvas.
- Ở tab Zone, bật Draw Zone rồi kéo trên map để tạo hình chữ nhật; submit form thêm zone và chọn zone mới.
- Tất cả dữ liệu tạo mới chỉ sống trong state React, không gọi API, không ghi file/local storage.

Các kiểu `MapEndpoint`, `MapZone` được định nghĩa trong `MapViewer.tsx`; các kiểu đối tượng liên quan Area/Aisle/Shelf và endpoint group ở `src/types/map.ts`.

Lưu ý khi mở rộng: `:id` trong URL hiện chỉ thay đổi ID hiển thị trên header/panel. Raster, endpoint/zone seed vẫn của map mẫu ID 1; endpoint/zone mới cũng gắn `sampleMap.id`. Cần thay bằng truy vấn theo ID khi tích hợp dữ liệu thật.

### 7.3. Render và tương tác canvas

`src/components/map/MapViewer.tsx` phụ trách tải và render nền map:

1. Fetch YAML từ `yamlUrl`; parse bằng `js-yaml` và kiểm tra `image`, `resolution`, `origin`.
2. Từ trường `image` trong YAML, resolve URL PGM tương đối với YAML.
3. Đọc PGM nhị phân `P5` với pixel 8-bit, chuyển thành `ImageData`.
4. Vẽ ảnh lên `<canvas>`, fit vào container, vẽ lưới và các overlay tùy tab.
5. Chuyển tọa độ world (mét) sang pixel bằng `origin`, `resolution` và chiều cao ảnh; chiều Y được đảo giữa world và ảnh.
6. Endpoint, đường nối aisle và zone được vẽ theo tọa độ world. Click chọn đối tượng; wheel/nút điều khiển zoom; kéo để pan khi đang zoom; nút reset trả về góc nhìn ban đầu.

Parser hiện chỉ hỗ trợ binary PGM `P5`, max value 255. Map YAML mẫu là `public/maps/floor1_library_v1.yaml`, ảnh tương ứng là `public/maps/floor1_library_v1.pgm`; khi thêm map tĩnh mới, đảm bảo đường dẫn `image` trong YAML đúng tương đối với file YAML.

`src/components/map/MapDetailPanel.tsx` là presentational panel nhận props và callback từ `MapDetail`. Panel hiển thị metadata, danh sách endpoint/zone, bộ lọc group, trạng thái được chọn và nút tạo/vẽ. Nên đặt logic state/submit ở page và để component dùng chung nhận dữ liệu qua props như pattern này.

### 7.4. Area, Aisle, Shelf

Các dữ liệu ví dụ tập trung trong `src/lib/mapData.ts`:

- Area liên kết với endpoint qua `endpoint_id`.
- Aisle có hai đầu mút qua `endpointA_id`, `endpointB_id`, đồng thời có `floor_id` và status.
- Shelf liên kết endpoint qua `endpoint_id` và aisle qua `aisle_id`.
- Endpoint có thể có `linked_object` với `kind` là `AREA`, `AISLE` hoặc `SHELF`; MapDetailPanel dùng kind để điều hướng đến trang tương ứng.

`AreaDetail`, `AisleDetail`, `ShelfDetail` hiển thị bảng khi không có `id` và hiển thị chi tiết khi có `id`. Tuy nhiên hiện router chỉ mount Area list và các trang Aisle/Shelf dạng có ID. Đây là các trang đọc dữ liệu mock, chưa có sửa/xóa/tạo.

## 8. Quy ước khi phát triển trang mới

1. Đặt trang trong `src/pages/`; dùng thư mục con theo feature khi feature có nhiều màn, theo cách `pages/maps/` hoặc `pages/aisles/`.
2. Tạo component page rõ ràng, export default; lấy route params bằng `useParams` từ `react-router` khi cần ID.
3. Đăng ký route trong `src/router/index.tsx` bên trong `AppLayout` để trang kế thừa Sidebar. Thêm route danh sách và route `/:id` riêng khi cả hai cần có URL riêng.
4. Thêm/cập nhật mục điều hướng trong `src/components/layout/Sidebar.tsx`; đảm bảo path khớp chính xác với route. Với mục danh sách, cân nhắc `NavLink end` nếu cần tránh active state trùng với trang con.
5. Tách dữ liệu dùng chung và kiểu dữ liệu: types vào `src/types/`, fixtures/mock data dùng chung vào `src/lib/`. Không nhân bản cùng một entity ở page khác nếu có thể dùng chung.
6. Nếu trang cần component presentational có thể tái sử dụng, đặt dưới `src/components/<feature>/` và truyền data/callback qua props. Để page sở hữu state và điều phối nghiệp vụ.
7. Dùng Tailwind utility và theme CSS variables đã có trong `src/index.css`; dùng `cn` từ `@/lib/utils` khi cần ghép class có điều kiện. Icon dùng `lucide-react`.
8. Với API sau này, thay fixture bằng service/data-access rõ ràng, giữ kiểu request/response ở một nơi, đồng thời xử lý loading, error, empty state và submit state. Không coi React state tạm là persistence.
9. Sau thay đổi, chạy `npm run build`; hiện project chưa cấu hình test tự động.

## 9. Điểm cần lưu ý khi tiếp tục dự án

- Đồng bộ route Shelf (`/shelf` trong Sidebar so với `/shelves/:id` trong router) và bổ sung route danh sách cần thiết.
- `FloorDetail.tsx` hiện rỗng; `/floors/:id` đang dùng placeholder.
- Nút Create Map, Filter và pagination của danh sách map chưa thực hiện nghiệp vụ.
- ID map trong trang chi tiết chưa chọn đúng dataset; map seed và YAML hiện cố định map tầng 1.
- Dữ liệu endpoint/zone tạo từ UI không được lưu sau khi tải lại trang.
- Route `*` redirect về `/`, vì vậy URL sai như `/shelf` không hiển thị trang 404.
- Chưa có backend/API, quản lý quyền, test, lint hoặc quy ước env được thiết lập trong package hiện tại.