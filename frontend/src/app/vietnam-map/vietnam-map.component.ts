import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ProductAPIService } from '../product-api.service';
import { Product } from '../../interface/Product';

interface ProvinceData {
  id: string;
  name: string;
  region: 'north' | 'central' | 'south';
  specialties: string[];
  image?: string;
  description?: string;
}

@Component({
  selector: 'app-vietnam-map',
  templateUrl: './vietnam-map.component.html',
  styleUrls: ['./vietnam-map.component.css']
})
export class VietnamMapComponent implements OnInit, AfterViewInit {
  @ViewChild('svgHost', { static: true }) svgHost!: ElementRef<HTMLDivElement>;
  @ViewChild('mapImage', { static: false }) mapImage!: ElementRef<HTMLImageElement>;

  selectedProvince: ProvinceData | null = null;
  hoveredProvinceId: string = '';
  hoveredProvinceName: string = '';
  tooltipX: number = 0;
  tooltipY: number = 0;

  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading: boolean = false;

  private readonly hoverFill: string = '#9B0000';

  // Optional label overrides for known SVG IDs
  private readonly idLabelMap: Record<string, string> = {
    HCM: 'TP Hồ Chí Minh',
    HN: 'Hà Nội',
    LD: 'Lâm Đồng'
  };

  // Abbreviation-to-full-name map from SVG/JSON codes
  private readonly codeToFullName: Record<string, string> = {
    AG: 'An Giang',
    BN: 'Bắc Ninh',
    CB: 'Cao Bằng',
    CM: 'Cà Mau',
    CT: 'Cần Thơ',
    DB: 'Điện Biên',
    DL: 'Đắk Lắk',
    DN: 'Đà Nẵng',
    DT: 'Đồng Tháp',
    GL: 'Gia Lai',
    H: 'Hà Nam',
    HCM: 'TP Hồ Chí Minh',
    HP: 'Hải Phòng',
    HT: 'Hà Tĩnh',
    HY: 'Hưng Yên',
    KH: 'Khánh Hòa',
    LC: 'Lào Cai',
    LD: 'Lâm Đồng',
    LS: 'Lạng Sơn',
    NA: 'Nghệ An',
    NB: 'Ninh Bình',
    PT: 'Phú Thọ',
    QN: 'Quảng Ninh',
    SL: 'Sơn La',
    TH: 'Thanh Hóa',
    TN: 'Tây Ninh',
    TQ: 'Tuyên Quang',
    VL: 'Vĩnh Long'
  };

  // Minimal seed; extend to 63 provinces later
  provinces: { [key: string]: ProvinceData } = {
    // Using province IDs from the map (slugified names)
    'ha_noi': { id: 'ha_noi', name: 'Hà Nội', region: 'north', specialties: ['Phở Hà Nội', 'Bún chả', 'Cốm Vòng'], image: '/assets/provinces/HCM.jpg', description: 'Thủ đô ngàn năm văn hiến với ẩm thực đậm đà bản sắc Bắc Bộ, nơi hội tụ tinh hoa văn hóa ẩm thực truyền thống Việt Nam.' },
    'hai_phong': { id: 'hai_phong', name: 'Hải Phòng', region: 'north', specialties: ['Bánh đa cua', 'Nem cua bể'], image: '/assets/provinces/Hải Phòng.jpg', description: 'Thành phố cảng với hải sản tươi ngon, nổi tiếng với những món ăn từ cua độc đáo và hấp dẫn.' },
    'quang_ninh': { id: 'quang_ninh', name: 'Quảng Ninh', region: 'north', specialties: ['Chả mực', 'Hải sản'], image: '/assets/provinces/HCM.jpg', description: 'Vùng biển Vịnh Hạ Long nổi tiếng với hải sản tươi sống và đặc sản chả mực thơm ngon khó quên.' },
    'thua_thien_hue': { id: 'thua_thien_hue', name: 'Thừa Thiên Huế', region: 'central', specialties: ['Bún bò Huế', 'Mè xửng'], image: '/assets/provinces/Huế.jpg', description: 'Cố đô mang đậm dấu ấn hoàng gia với ẩm thực tinh tế, cầu kỳ và hương vị độc đáo của xứ Huế.' },
    'tp_hue': { id: 'tp_hue', name: 'Thừa Thiên Huế', region: 'central', specialties: ['Bún bò Huế', 'Mè xửng'], image: '/assets/provinces/Huế.jpg', description: 'Cố đô mang đậm dấu ấn hoàng gia với ẩm thực tinh tế, cầu kỳ và hương vị độc đáo của xứ Huế.' },
    'a_nang': { id: 'a_nang', name: 'Đà Nẵng', region: 'central', specialties: ['Mì Quảng', 'Bánh tráng cuốn thịt heo'], image: '/assets/provinces/Danang.jpg', description: 'Thành phố đáng sống với biển xanh cát trắng, ẩm thực đa dạng từ núi đến biển, nổi bật với Mì Quảng đậm đà.' },
    'quang_nam': { id: 'quang_nam', name: 'Quảng Nam', region: 'central', specialties: ['Cao lầu', 'Mì Quảng'], image: '/assets/provinces/HCM.jpg', description: 'Mảnh đất di sản với phố cổ Hội An và những món ăn truyền thống độc đáo mang hương vị riêng biệt.' },
    'quang_ngai': { id: 'quang_ngai', name: 'Quảng Ngãi', region: 'central', specialties: ['Bánh xèo', 'Mỳ Quảng'], image: '/assets/provinces/Quang Ngãi.jpg', description: 'Vùng đất Miền Trung với đặc sản giản dị nhưng đậm đà hương vị quê hương.' },
    'khanh_hoa': { id: 'khanh_hoa', name: 'Khánh Hòa', region: 'central', specialties: ['Yến sào', 'Nem nướng Nha Trang'], image: '/assets/provinces/Khánh Hòa.jpg', description: 'Thành phố biển Nha Trang với hải sản phong phú và đặc sản yến sào quý giá nổi tiếng khắp cả nước.' },
    'tp_ho_chi_minh': { id: 'tp_ho_chi_minh', name: 'TP. Hồ Chí Minh', region: 'south', specialties: ['Bánh mì Sài Gòn', 'Cơm tấm', 'Hủ tiếu'], image: '/assets/provinces/HCM.jpg', description: 'Thành phố sôi động nhất cả nước, nơi hội tụ ẩm thực đa dạng từ ba miền, mang đậm văn hóa ẩm thực đường phố Sài Gòn.' },
    'lam_ong': { id: 'lam_ong', name: 'Lâm Đồng', region: 'central', specialties: ['Rau Đà Lạt', 'Atisô', 'Dâu tây'], image: '/assets/provinces/Lâm Đồng.jpg', description: 'Cao nguyên mộng mơ với khí hậu mát mẻ, nổi tiếng với rau củ quả tươi ngon và đặc sản vùng cao.' },
    'ong_nai': { id: 'ong_nai', name: 'Đồng Nai', region: 'south', specialties: ['Bánh tráng', 'Khoai lang'], image: '/assets/provinces/Đồng Nai.jpg', description: 'Vùng đất công nghiệp phát triển với đặc sản bánh tráng nổi tiếng và nhiều đặc sản vùng đồng bằng.' },
    'long_an': { id: 'long_an', name: 'Long An', region: 'south', specialties: ['Gạo Nàng Thơm', 'Thanh long'], image: '/assets/provinces/HCM.jpg', description: 'Vựa lúa với gạo thơm ngon và trái cây đặc sản của vùng đồng bằng sông Cửu Long.' },
    'can_tho': { id: 'can_tho', name: 'Cần Thơ', region: 'south', specialties: ['Bánh tét lá cẩm', 'Bánh cống'], image: '/assets/provinces/Cần Thơ.jpg', description: 'Trung tâm miền Tây sông nước với chợ nổi độc đáo và ẩm thực Nam Bộ đậm đà hương vị quê nhà.' },
    'kien_giang': { id: 'kien_giang', name: 'Kiên Giang', region: 'south', specialties: ['Nước mắm Phú Quốc', 'Hải sản'], image: '/assets/provinces/HCM.jpg', description: 'Vùng biển đảo với nước mắm Phú Quốc nổi tiếng thế giới và hải sản tươi ngon hảo hạng.' },
    'tay_ninh': { id: 'tay_ninh', name: 'Tây Ninh', region: 'south', specialties: ['Bánh tráng tây ninh', 'Măng khô'], image: '/assets/provinces/Tây Ninh.jpg', description: 'Vùng đất giáp biên giới với đặc sản bánh tráng và các món ăn mang hương vị đồng bằng Nam Bộ.' },
    'an_giang': { id: 'an_giang', name: 'An Giang', region: 'south', specialties: ['Cá lóc nướng trui', 'Bánh xèo'], image: '/assets/provinces/An Giang.jpg', description: 'Miền Tây sông nước với cá lóc nướng trui đặc trưng và văn hóa ẩm thực đồng bằng phong phú.' },
    'ong_thap': { id: 'ong_thap', name: 'Đồng Tháp', region: 'south', specialties: ['Cá tai tượng', 'Cá linh'], image: '/assets/provinces/Đồng Tháp.webp', description: 'Vùng đất hoa sen với đặc sản cá đồng nổi tiếng và ẩm thực sông nước đặc sắc.' },
    'vinh_long': { id: 'vinh_long', name: 'Vĩnh Long', region: 'south', specialties: ['Bánh tét', 'Cá tai tượng'], image: '/assets/provinces/Vĩnh Long.jpg', description: 'Mảnh đất miệt vườn với trái cây ngọt lịm và đặc sản từ sông nước miền Tây.' },
    'ca_mau': { id: 'ca_mau', name: 'Cà Mau', region: 'south', specialties: ['Mắm cá sặc', 'Tôm sú'], image: '/assets/provinces/Cà Mau.jpg', description: 'Mũi đất cực Nam Tổ quốc với đặc sản tôm cá và mắm đậm đà hương vị biển cả.' },
    'ninh_binh': { id: 'ninh_binh', name: 'Ninh Bình', region: 'north', specialties: ['Cơm cháy', 'Dê núi', 'Cá kèo'], image: '/assets/provinces/Ninh Bình.jpg', description: 'Cố đô Hoa Lư với danh thắng Tràng An, nổi tiếng với đặc sản cơm cháy và món dê núi thơm ngon.' },
    'bac_ninh': { id: 'bac_ninh', name: 'Bắc Ninh', region: 'north', specialties: ['Chả cá Kinh Bắc', 'Bánh đậu xanh'], image: '/assets/provinces/Bắc Ninh.png', description: 'Miền đất võ Kinh Bắc với chả cá và bánh đậu xanh nổi tiếng cả nước.' },
    'hung_yen': { id: 'hung_yen', name: 'Hưng Yên', region: 'north', specialties: ['Long nhãn', 'Bánh đậu xanh'], image: '/assets/provinces/Hưng Yên.jpg', description: 'Xứ sở của long nhãn thơm ngọt và nhiều đặc sản truyền thống Bắc Bộ.' },
    'phu_tho': { id: 'phu_tho', name: 'Phú Thọ', region: 'north', specialties: ['Bánh tai', 'Khế Thanh Sơn'], image: '/assets/provinces/Phú Thọ.jpg', description: 'Đất tổ Hùng Vương với đặc sản bánh tai và khế Thanh Sơn nổi tiếng.' },
    'thai_nguyen': { id: 'thai_nguyen', name: 'Thái Nguyên', region: 'north', specialties: ['Chè Tân Cương', 'Bánh trôi tàu'], image: '/assets/provinces/Thái Nguyên.jpg', description: 'Miền đất trà nổi tiếng với chè Tân Cương đặc sản và cách mạng.' },
    'lao_cai': { id: 'lao_cai', name: 'Lào Cai', region: 'north', specialties: ['Thịt trâu gác bếp', 'Cá tầm'], image: '/assets/provinces/Lào Cai.webp', description: 'Vùng núi Tây Bắc với đặc sản thịt trâu gác bếp và cá tầm Sa Pa.' },
    'gia_lai': { id: 'gia_lai', name: 'Gia Lai', region: 'central', specialties: ['Thịt bò khô', 'Rượu cần'], image: '/assets/provinces/Gia Lai.jpg', description: 'Cao nguyên Tây Nguyên với đặc sản thịt bò khô và văn hóa rượu cần độc đáo.' },
    'ak_lak': { id: 'ak_lak', name: 'Đắk Lắk', region: 'central', specialties: ['Cà phê Buôn Ma Thuột', 'Khô cá lăng'], image: '/assets/provinces/Đắk Lắk.jpg', description: 'Thủ phủ cà phê Việt Nam với cà phê Buôn Ma Thuột nổi tiếng thế giới.' },
    // Các tỉnh Bắc Bộ còn thiếu
    'ien_bien': { id: 'ien_bien', name: 'Điện Biên', region: 'north', specialties: ['Thịt trâu gác bếp', 'Măng rừng'], image: '/assets/provinces/HCM.jpg', description: 'Vùng cao biên giới với lịch sử hào hùng và ẩm thực núi rừng đặc sắc.' },
    'lai_chau': { id: 'lai_chau', name: 'Lai Châu', region: 'north', specialties: ['Măng khô', 'Cá suối'], image: '/assets/provinces/HCM.jpg', description: 'Miền núi Tây Bắc với đặc sản từ rừng núi và văn hóa dân tộc phong phú.' },
    'tuyen_quang': { id: 'tuyen_quang', name: 'Tuyên Quang', region: 'north', specialties: ['Bánh khảo', 'Chả lụa'], image: '/assets/provinces/HCM.jpg', description: 'Miền đất cách mạng với đặc sản bánh khảo truyền thống nổi tiếng.' },
    'cao_bang': { id: 'cao_bang', name: 'Cao Bằng', region: 'north', specialties: ['Hạt dẻ', 'Thịt trâu'], image: '/assets/provinces/HCM.jpg', description: 'Vùng núi đá vôi với thác Bản Giốc hùng vĩ và đặc sản hạt dẻ thơm bùi.' },
    'son_la': { id: 'son_la', name: 'Sơn La', region: 'north', specialties: ['Cá suối', 'Mận Mộc Châu'], image: '/assets/provinces/HCM.jpg', description: 'Cao nguyên Mộc Châu với sữa tươi và mận ngọt đặc sản vùng núi.' },
    'lang_son': { id: 'lang_son', name: 'Lạng Sơn', region: 'north', specialties: ['Mắc khén', 'Đào tiên'], image: '/assets/provinces/Lạng Sơn.jpg', description: 'Cửa khẩu biên giới với đặc sản mắc khén độc đáo và đào tiên ngọt lịm.' },
    'thanh_hoa': { id: 'thanh_hoa', name: 'Thanh Hóa', region: 'north', specialties: ['Bánh trôi', 'Cá trích'], image: '/assets/provinces/HCM.jpg', description: 'Cố đô Hồ với đặc sản bánh trôi nổi tiếng và hải sản biển Sầm Sơn.' },
    'nghe_an': { id: 'nghe_an', name: 'Nghệ An', region: 'north', specialties: ['Trà Cẩm', 'Tôm càng xanh'], image: '/assets/provinces/HCM.jpg', description: 'Quê hương Bác Hồ với đặc sản trà Cẩm và tôm càng xanh sông Lam.' },
    'ha_tinh': { id: 'ha_tinh', name: 'Hà Tĩnh', region: 'central', specialties: ['Chả cá', 'Nghệ'], image: '/assets/provinces/Hà Tĩnh.jpeg', description: 'Vùng đất cách mạng với đặc sản chả cá Hà Tĩnh và nghệ vàng nổi tiếng.' },
    // Các tỉnh Trung Bộ còn thiếu
    'quang_tri': { id: 'quang_tri', name: 'Quảng Trị', region: 'central', specialties: ['Bún bò', 'Cá đục'], image: '/assets/provinces/HCM.jpg', description: 'Vùng đất anh hùng với ẩm thực đậm chất Huế và hải sản vùng cửa Việt.' },
    // Các tỉnh Nam Bộ còn thiếu
    'phu_quoc': { id: 'phu_quoc', name: 'Phú Quốc', region: 'south', specialties: ['Nước mắm', 'Hải sản'], image: '/assets/provinces/HCM.jpg', description: 'Đảo Ngọc với nước mắm nổi tiếng thế giới và hải sản tươi ngon hảo hạng.' },
    'q_hoang_sa': { id: 'q_hoang_sa', name: 'Q.Đ Hoàng Sa', region: 'central', specialties: ['Hải sản'], image: '/assets/provinces/Q.Đ Hoàng Sa.jpeg', description: 'Quần đảo Hoàng Sa - chủ quyền thiêng liêng của Tổ quốc.' },
    'q_truong_sa': { id: 'q_truong_sa', name: 'Q.Đ Trường Sa', region: 'south', specialties: ['Hải sản'], image: '/assets/provinces/HCM.jpg', description: 'Quần đảo Trường Sa - tiền đồn bảo vệ chủ quyền biển đảo Tổ quốc.' }
  };

  private provinceNameById: Record<string, string> = {};

  constructor(
    private productService: ProductAPIService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadProvinceMeta();
    this.loadAllProducts();
  }

  private loadProvinceMeta(): void {
    this.http.get<Array<{ id: string; name: string }>>('assets/map/vn-provinces.json').subscribe({
      next: (items) => {
        const map: Record<string, string> = {};
        items.forEach(item => {
          if (item.id && item.name) {
            const code = (item.name || '').toUpperCase();
            const full = this.codeToFullName[code] || item.name;
            map[item.id] = full;
            // Create base province entries if missing so click panel shows friendly name
            if (!this.provinces[item.id]) {
              this.provinces[item.id] = {
                id: item.id,
                name: full,
                region: 'north',
                specialties: []
              };
            } else {
              this.provinces[item.id].name = full;
            }
            // Assign default image if not explicitly provided
            if (!this.provinces[item.id].image) {
              this.provinces[item.id].image = this.buildDefaultProvinceImage(full);
            }
          }
        });
        this.provinceNameById = map;
      },
      error: () => {
        // ignore if not found; component still works via fallback
      }
    });
  }

  svgMarkup: string = '';
  svgSafeHtml: SafeHtml | null = null;
  useImageMap: boolean = true;

  // Image map base data (can be extended or generated)
  areasBase: Array<{ id?: string; name: string; coords: number[] }> = [
    // Bắc bộ
    { name: 'Điện Biên', coords: [43,42,70,56,103,64,118,75,104,116,92,129] },
    { name: 'Lai Châu', coords: [88,44,64,31,56,42,50,42,134,85,132,64,107,31] },
    { name: 'Lào Cai', coords: [116,29,139,49,147,27,183,73,176,100,150,97,136,86] },
    { name: 'Tuyên Quang', coords: [212,13,199,22,211,49,208,81,196,94,156,32,178,14,193,2] },
    { name: 'Cao Bằng', coords: [269,29,204,12,200,29,222,41,252,48] },
    { name: 'Sơn La', coords: [177,106,114,72,102,128,120,134,142,123,170,134,180,129,181,126] },
    { name: 'Thái Nguyên', coords: [237,87,243,46,207,34,209,92,228,100] },
    { name: 'Lạng Sơn', coords: [299,87,268,58,244,45,238,80,241,92,268,91,289,100] },
    { name: 'Phú Thọ', coords: [219,101,179,83,179,138,211,154,224,145,188,108] },
    { name: 'Ninh Bình', coords: [213,152,239,173,257,155,223,132] },
    { name: 'Hà Nội', coords: [188,107,225,141,233,123,224,97] },
    { name: 'Bắc Ninh', coords: [287,93,273,110,235,119,226,104,234,89] },
    { name: 'Quảng Ninh', coords: [262,114,292,137,340,89,302,84] },
    { name: 'Hải Phòng', coords: [241,130,264,137,277,122,264,114,231,119] },
    { name: 'Hưng Yên', coords: [262,160,229,140,229,124,264,140] },
    { name: 'Thanh Hóa', coords: [216,201,234,168,188,140,155,135,152,152,180,168,198,190] },
    { name: 'Nghệ An', coords: [221,208,180,173,147,180,130,203,196,236,218,236] },
    { name: 'Hà Tĩnh', coords: [198,262,262,274,221,231,188,239] },
    // Trung bộ
    { name: 'Quảng Trị', coords: [277,348,302,325,257,272,203,264] },
    { name: 'TP Huế', coords: [333,348,292,325,279,348,297,358,310,363] },
    { name: 'Đà Nẵng', coords: [366,394,340,366,330,350,284,373,305,399,333,411] },
    { name: 'Quảng Ngãi', coords: [328,409,302,404,297,462,381,422,368,394] },
    { name: 'Gia Lai', coords: [389,470,378,424,297,462,307,488,338,488,356,508] },
    { name: 'Đắk Lắk', coords: [358,505,340,490,310,490,300,513,330,546,361,541,394,510,386,472] },
    { name: 'Khánh Hòa', coords: [371,592,353,574,363,541,394,508,383,564] },
    { name: 'Lâm Đồng', coords: [287,543,307,627,328,617,371,594,353,574,363,543,325,546,305,521] },
    { name: 'Đồng Nai', coords: [310,622,290,549,251,556,251,584,269,584,279,599,269,617,279,625,292,617] },
    { name: 'TP Hồ Chí Minh', coords: [295,617,279,625,269,615,277,597,264,579,246,584,249,607,262,632,279,643,312,625] },
    { name: 'Tây Ninh', coords: [231,630,267,635,249,599,246,589,254,574,234,566,226,582,239,604,206,607] },
    { name: 'Đồng Tháp', coords: [277,640,229,627,203,604,190,610,213,648,241,635,274,648] },
    { name: 'Vĩnh Long', coords: [257,681,211,645,241,637,269,643,262,663] },
    { name: 'Cần Thơ', coords: [257,678,229,660,208,637,190,643,208,658,201,673,226,691] },
    { name: 'An Giang', coords: [198,683,211,658,193,640,208,637,188,607,173,627,157,632,168,648,190,655,173,663,173,676] },
    { name: 'Cà Mau', coords: [198,683,175,673,168,724,188,724,229,691,206,678] },
    { name: 'Phú Quốc', coords: [124,625,122,650,127,663,140,660,152,630] },
    { name: 'Q.Đ Hoàng Sa', coords: [460,284,574,310,579,350,549,386,488,394,457,363,450,330] },
    { name: 'Q.Đ Trường Sa', coords: [424,734,480,709,533,670,582,617,607,579,678,541,754,554,782,653,744,744,693,782,635,792,493,790,429,777] }
  ];
  areasScaled: Array<{ id: string; name: string; coordsStr: string }> = [];

  ngAfterViewInit(): void {
    if (this.useImageMap) {
      setTimeout(() => this.scaleAreas(), 0);
      window.addEventListener('resize', () => this.scaleAreas());
    } else {
      // Inline-load SVG to avoid <object> cross-document issues
      this.http.get('assets/New VN Maps (4).svg', { responseType: 'text' }).subscribe({
        next: (svg) => {
          this.svgMarkup = svg;
          this.svgSafeHtml = this.sanitizer.bypassSecurityTrustHtml(this.svgMarkup);
          this.cdr.detectChanges();
          // Wait for DOM to render innerHTML
          setTimeout(() => this.wireSvgInteractionsInline(), 0);
        }
      });
    }
  }

  private loadAllProducts(): void {
    this.isLoading = true;
    this.productService.getProducts(1, 200).subscribe({
      next: (data) => {
        this.products = data.products.map(p => new Product(
          p._id || '',
          p.product_name || '',
          p.product_detail || '',
          p.stocked_quantity || 0,
          p.unit_price || 0,
          p.discount || 0,
          p.createdAt || '',
          p.image_1 || '',
          p.image_2 || '',
          p.image_3 || '',
          p.image_4 || '',
          p.image_5 || '',
          p.product_dept || '',
          p.rating || 0
        ));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private wireSvgInteractionsInline(): void {
    const host = this.svgHost?.nativeElement as HTMLDivElement | null;
    if (!host) return;
    const svg = host.querySelector('svg');
    if (!svg) return;
    const svgDoc = svg.ownerDocument as Document;

    // Collect shapes/groups that likely represent provinces (prefer groups with id)
    const groupCandidates = Array.from(svg.querySelectorAll<SVGGraphicsElement>('g[id], g[data-name]'));
    const shapeCandidates = Array.from(svg.querySelectorAll<SVGGraphicsElement>('path[id], polygon[id], rect[id]'));
    const candidates: SVGGraphicsElement[] = [...groupCandidates, ...shapeCandidates];

    // Apply alternating base colors
    const baseColors = ['#810000', '#630000'];
    let colorIndex = 0;

    candidates.forEach((el, idx) => {
      const { id: rawId, label } = this.extractProvinceIdentity(el, idx);
      const provinceId = rawId || `AUTO_${idx}`;

      const container = el.closest('g[id], g[data-name]') as SVGGraphicsElement || el;
      const shapes = Array.from(container.querySelectorAll<SVGGraphicsElement>('path, polygon, rect'));
      const targetShapes = shapes.length > 0 ? shapes : [container];

      // Tag metadata on container
      (container as any).dataset = (container as any).dataset || {};
      (container as any).dataset['provinceId'] = provinceId;
      (container as any).dataset['provinceLabel'] = label;
      (container as any).style.cursor = 'pointer';

      // Base fill for all shapes
      const chosen = baseColors[colorIndex % baseColors.length];
      colorIndex++;
      targetShapes.forEach(s => {
        const se = s as SVGElement & { style: CSSStyleDeclaration };
        if (!(se as any).dataset) (se as any).dataset = {} as any;
        if (!(se as any).dataset['originalFill']) {
          (se as any).dataset['originalFill'] = se.getAttribute('fill') || se.style.fill || '';
        }
        se.style.fill = chosen;
        se.style.pointerEvents = 'all';
        se.style.stroke = '#2e0000';
        se.style.strokeWidth = '0.5';
      });

      const onEnter = (e: Event) => {
        const me = e as MouseEvent;
        this.hoveredProvinceId = provinceId;
        this.hoveredProvinceName = label;
        targetShapes.forEach(s => {
          const se = s as SVGElement & { style: CSSStyleDeclaration };
          se.style.fill = this.hoverFill;
        });
        this.updateTooltipPosition(me);
        this.cdr.detectChanges();
      };
      const onMove = (e: Event) => {
        const me = e as MouseEvent;
        this.updateTooltipPosition(me);
        this.cdr.detectChanges();
      };
      const onLeave = () => {
        this.hoveredProvinceId = '';
        this.hoveredProvinceName = '';
        targetShapes.forEach(s => {
          const se = s as any;
          const orig = se.dataset?.originalFill;
          if (orig !== undefined) se.style.fill = orig;
        });
        this.cdr.detectChanges();
      };
      const onActivate = () => {
        if (!this.provinces[provinceId]) {
          this.provinces[provinceId] = { id: provinceId, name: label, region: 'north', specialties: [] };
        }
        if (!this.provinces[provinceId].image) {
          this.provinces[provinceId].image = this.buildDefaultProvinceImage(label);
        }
        this.onProvinceClick(provinceId);
        this.cdr.detectChanges();
      };

      container.addEventListener('mouseenter', onEnter);
      container.addEventListener('mousemove', onMove);
      container.addEventListener('mouseleave', onLeave);
      container.addEventListener('click', onActivate);
      container.addEventListener('touchstart', (e: Event) => { e.preventDefault(); onActivate(); });
    });

    // Delegated events from SVG root to catch any missed shapes
    const rootSvg = svg;
    if (rootSvg) {
      const selector = 'g[id], g[data-name], path, polygon, rect';
      const getTargetEl = (e: Event): Element | null => {
        const t = e.target as Element | null;
        return t ? (t.closest(selector) as Element | null) : null;
      };

      rootSvg.addEventListener('mouseover', (e: Event) => {
        const el = getTargetEl(e);
        if (!el) return;
        const idx = Array.from(svgDoc.querySelectorAll(selector)).indexOf(el as any);
        const { id, label } = this.extractProvinceIdentity(el, idx >= 0 ? idx : 0);
        this.hoveredProvinceId = id || `AUTO_${idx}`;
        this.hoveredProvinceName = label;
        const shapes = (el as Element).querySelectorAll('path, polygon, rect');
        if (shapes.length) {
          shapes.forEach((s: any) => {
            if (!s.dataset) s.dataset = {} as any;
            if (!s.dataset.originalFill) s.dataset.originalFill = s.getAttribute('fill') || s.style.fill || '';
            s.style.fill = this.hoverFill;
          });
        } else if ((el as any).style) {
          const anyEl = el as any;
          if (!anyEl.dataset) anyEl.dataset = {} as any;
          if (!anyEl.dataset.originalFill) anyEl.dataset.originalFill = anyEl.getAttribute?.('fill') || anyEl.style.fill || '';
          anyEl.style.fill = this.hoverFill;
        }
        this.cdr.detectChanges();
      }, true);

      rootSvg.addEventListener('mousemove', (e: Event) => {
        const me = e as MouseEvent;
        this.updateTooltipPosition(me);
        this.cdr.detectChanges();
      }, true);

      rootSvg.addEventListener('mouseout', (e: Event) => {
        const el = getTargetEl(e);
        if (!el) return;
        const shapes = (el as Element).querySelectorAll('path, polygon, rect');
        if (shapes.length) {
          shapes.forEach((s: any) => {
            const orig = s.dataset?.originalFill;
            if (orig !== undefined) s.style.fill = orig;
          });
        } else if ((el as any).style) {
          const orig = (el as any).dataset?.originalFill;
          if (orig !== undefined) (el as any).style.fill = orig;
        }
        this.hoveredProvinceId = '';
        this.hoveredProvinceName = '';
        this.cdr.detectChanges();
      }, true);

      rootSvg.addEventListener('click', (e: Event) => {
        const el = getTargetEl(e);
        if (!el) return;
        const idx = Array.from(svgDoc.querySelectorAll(selector)).indexOf(el as any);
        const { id, label } = this.extractProvinceIdentity(el, idx >= 0 ? idx : 0);
        const provinceId = id || `AUTO_${idx}`;
        if (!this.provinces[provinceId]) {
          this.provinces[provinceId] = { id: provinceId, name: label, region: 'north', specialties: [] };
        }
        if (!this.provinces[provinceId].image) {
          this.provinces[provinceId].image = this.buildDefaultProvinceImage(label);
        }
        this.onProvinceClick(provinceId);
        this.cdr.detectChanges();
      }, true);
    }

    // Dump all detected IDs/labels for mapping reference (one-time)
    this.dumpSvgIdsToConsole(svgDoc);
  }

  private scaleAreas(): void {
    const img = this.mapImage?.nativeElement;
    if (!img || !img.naturalWidth || !img.naturalHeight) {
      // Try later if image not loaded yet
      if (img) img.onload = () => this.scaleAreas();
      return;
    }
    const scaleX = img.clientWidth / img.naturalWidth;
    const scaleY = img.clientHeight / img.naturalHeight;
    this.areasScaled = this.areasBase
      .filter(a => Array.isArray(a.coords) && a.coords.length >= 6)
      .map((a, idx) => {
      const scaled: number[] = [];
      for (let i = 0; i < a.coords.length; i += 2) {
        scaled.push(Math.round(a.coords[i] * scaleX));
        scaled.push(Math.round(a.coords[i + 1] * scaleY));
      }
        const fallbackId = this.slugify(a.name) || `area_${idx}`;
        const id = a.id || fallbackId;
        return { id, name: a.name, coordsStr: scaled.join(',') };
      });
    this.cdr.detectChanges();
  }

  onAreaEnter(area: { id: string; name: string }, e: MouseEvent): void {
    this.hoveredProvinceId = area.id;
    this.hoveredProvinceName = area.name;
    this.updateTooltipPosition(e);
  }

  onAreaLeave(): void {
    this.hoveredProvinceId = '';
    this.hoveredProvinceName = '';
  }

  onAreaClick(area: { id: string; name: string }): void {
    if (!this.provinces[area.id]) {
      this.provinces[area.id] = { id: area.id, name: area.name, region: 'north', specialties: [] };
    }
    if (!this.provinces[area.id].image) {
      this.provinces[area.id].image = this.buildDefaultProvinceImage(area.name);
    }
    this.onProvinceClick(area.id);
  }

  private slugify(name: string): string {
    return name
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  private dumpSvgIdsToConsole(svgDoc: Document): void {
    try {
      const selector = 'g[id], g[data-name], path[id], polygon[id], rect[id]';
      const list = Array.from(svgDoc.querySelectorAll<SVGGraphicsElement>(selector));
      const results: Array<{ id: string; name: string; cx: number; cy: number }> = [];
      const seen = new Set<string>();
      list.forEach((el, idx) => {
        const { id, label } = this.extractProvinceIdentity(el, idx);
        const key = id || `AUTO_${idx}`;
        if (seen.has(key)) return;
        seen.add(key);
        const bbox = (el as any).getBBox ? (el as any).getBBox() : { x: 0, y: 0, width: 0, height: 0 };
        const cx = bbox.x + bbox.width / 2;
        const cy = bbox.y + bbox.height / 2;
        results.push({ id: key, name: label, cx, cy });
      });
      // Sort for readability
      results.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
      // Helpful copy-paste JSON in console
      // eslint-disable-next-line no-console
      console.log('[VietnamMap] Detected provinces with centers:', results);
    } catch {
      // ignore
    }
  }

  private extractProvinceIdentity(el: Element, idx: number): { id: string; label: string } {
    const idAttrRaw = el.getAttribute('id') || '';
    const idAttr = idAttrRaw;
    const titleEl = el.querySelector('title');
    const attrs = ['data-name', 'name', 'title'];
    let label = '';
    for (const a of attrs) {
      const v = el.getAttribute(a);
      if (v) { label = v; break; }
    }
    if (!label && titleEl?.textContent) label = titleEl.textContent;
    if (!label && idAttr) {
      const code = idAttr.toUpperCase();
      label = this.provinceNameById[idAttr] || this.idLabelMap[code] || this.codeToFullName[code] || idAttr;
    }
    if (!label) label = `Tỉnh/TP ${idx + 1}`;
    return { id: idAttr, label };
  }

  private findProvinceByName(name: string): ProvinceData | null {
    const normalized = name.trim().toLowerCase();
    const all = Object.values(this.provinces);
    return all.find(p => p.name.toLowerCase() === normalized || normalized.includes(p.name.toLowerCase())) || null;
  }

  private updateTooltipPosition(e: MouseEvent): void {
    // Position relative to viewport
    this.tooltipX = e.clientX + 12;
    this.tooltipY = e.clientY + 12;
  }

  onProvinceClick(provinceId: string): void {
    const province = this.provinces[provinceId] || null;
    this.selectedProvince = province;
    console.log('Province clicked:', provinceId);
    console.log('Selected province data:', province);
    console.log('Image path:', province?.image);
    
    if (!province) {
      this.filteredProducts = [];
      return;
    }

    // Always align image to the full province name on click
    const desiredSrc = this.buildDefaultProvinceImage(province.name);
    if (this.provinces[provinceId].image !== desiredSrc) {
      this.provinces[provinceId].image = desiredSrc;
    }

    // Clear any fallback progress attributes on current image element
    setTimeout(() => {
      const imgEl = document.querySelector('.province-image') as HTMLImageElement | null;
      if (imgEl) {
        imgEl.removeAttribute('data-base-index');
        imgEl.removeAttribute('data-ext-index');
      }
    }, 0);

    const provinceNameLower = province.name.toLowerCase();
    const provinceIdLower = province.id.toLowerCase();
    this.filteredProducts = this.products.filter(p => {
      const dept = (p.product_dept || '').toLowerCase();
      return dept.includes(provinceNameLower) || dept.includes(provinceIdLower);
    });

    // Scroll panel into view on mobile
    setTimeout(() => {
      if (window.innerWidth < 768) {
        const panel = document.querySelector('.province-panel');
        panel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 50);
  }

  clearSelection(): void {
    this.selectedProvince = null;
    this.filteredProducts = [];
  }

  getProvinceName(provinceId: string): string {
    return this.provinces[provinceId]?.name || provinceId;
  }

  getRegionColor(region: string): string {
    const colors: { [key: string]: string } = {
      north: '#4A90E2',
      central: '#F39C12',
      south: '#E74C3C'
    };
    return colors[region] || '#95a5a6';
  }

  onImageError(event: any): void {
    const target: HTMLImageElement = event.target as HTMLImageElement;
    const provinceName = this.selectedProvince?.name || '';
    const baseNames = this.generateProvinceFilenameCandidates(provinceName);
    const exts = ['.jpg', '.jpeg', '.png', '.webp'];
    const baseIdxAttr = target.getAttribute('data-base-index');
    const extIdxAttr = target.getAttribute('data-ext-index');
    let baseIdx = baseIdxAttr ? parseInt(baseIdxAttr, 10) : 0;
    let extIdx = extIdxAttr ? parseInt(extIdxAttr, 10) : 0;

    // Advance to next candidate
    extIdx++;
    if (extIdx >= exts.length) {
      extIdx = 0;
      baseIdx++;
    }

    if (baseIdx < baseNames.length) {
      target.setAttribute('data-base-index', String(baseIdx));
      target.setAttribute('data-ext-index', String(extIdx));
      target.src = `/assets/provinces/${baseNames[baseIdx]}${exts[extIdx]}`;
      return;
    }

    console.error('Image failed to load after all fallbacks:', target.src);
    target.removeAttribute('data-base-index');
    target.removeAttribute('data-ext-index');
    target.src = '/assets/default-image.png';
  }

  private buildDefaultProvinceImage(name: string): string {
    // Prefer .jpg by default; error handler will try other candidates
    const bases = this.generateProvinceFilenameCandidates(name);
    const first = bases[0] || name;
    return `/assets/provinces/${first}.jpg`;
  }

  private generateProvinceFilenameCandidates(name: string): string[] {
    const aliases: Record<string, string[]> = {
      'tp ho chi minh': ['HCM', 'TP HCM', 'TP. HCM', 'Ho Chi Minh', 'TP Hồ Chí Minh', 'TP. Hồ Chí Minh', 'HoChiMinh'],
      'ha noi': ['Hà Nội', 'Hanoi'],
      'hai phong': ['Hải Phòng', 'Haiphong'],
      'da nang': ['Đà Nẵng', 'Danang', 'DaNang'],
      'can tho': ['Cần Thơ', 'CanTho'],
      'tp hue': ['Thừa Thiên Huế', 'TP Huế', 'TP. Huế', 'Huế', 'Hue'],
      'thua thien hue': ['TP Huế', 'TP. Huế', 'Huế', 'Hue'],
      'quang ngai': ['Quảng Ngãi', 'Quang Ngãi', 'Quảng Ngai', 'QuangNgai'],
      'khanh hoa': ['Khánh Hòa', 'Khanh Hòa', 'KhanhHoa'],
      'binh dinh': ['Bình Định', 'BinhDinh'],
      'ba ria  vung tau': ['Bà Rịa - Vũng Tàu', 'Ba Ria Vung Tau', 'Vũng Tàu', 'Vung Tau', 'VungTau'],
      'lang son': ['Lạng Sơn', 'Lang Sơn', 'Lang Son', 'LangSon'],
      'ha tinh': ['Hà Tĩnh', 'Ha Tĩnh', 'Ha Tinh', 'HaTinh'],
      'q hoang sa': ['Q.Đ Hoàng Sa', 'QĐ Hoàng Sa', 'Q.D Hoang Sa', 'Hoàng Sa', 'Hoang Sa'],
    };

    const stripDiacritics = (s: string) => s
      .normalize('NFD').replace(/\p{Diacritic}/gu, '')
      .replace(/Đ/g, 'D').replace(/đ/g, 'd');
    const stripPunct = (s: string) => s.replace(/[.,/#!$%\^&*;:{}=+_`~()\-]/g, ' ');
    const normalizeSpaces = (s: string) => s.replace(/\s+/g, ' ').trim();
    const basicNormalize = (s: string) => normalizeSpaces(stripPunct(stripDiacritics(s))).toLowerCase();

    // Remove common prefixes like TP/Tỉnh/Thành phố for matching
    const removeCommonPrefixes = (s: string) => {
      const re = /^(tp\.?|tinh|tỉnh|thanh pho|thành phố)\s+/i;
      return s.replace(re, '').trim();
    };

    const compact = (s: string) => normalizeSpaces(stripDiacritics(s));
    const tight = (s: string) => compact(s).replace(/\s+/g, '');

    const baseList: string[] = [];
    const pushUnique = (v: string) => {
      if (!v) return;
      if (!baseList.includes(v)) baseList.push(v);
    };

    // Exact label first
    pushUnique(name);
    // Variants based on removing prefixes
    const nameNoPrefix = removeCommonPrefixes(name);
    if (nameNoPrefix !== name) pushUnique(nameNoPrefix);
    // No-diacritics spaced and tight
    pushUnique(compact(name));
    pushUnique(tight(name));
    if (nameNoPrefix !== name) {
      pushUnique(compact(nameNoPrefix));
      pushUnique(tight(nameNoPrefix));
    }

    // Alias lookup by normalized key
    const normKey = basicNormalize(name);
    const normKeyNoPrefix = basicNormalize(nameNoPrefix);
    const aliasSets: string[][] = [];
    Object.entries(aliases).forEach(([k, arr]) => {
      const nk = normalizeSpaces(k);
      if (nk === normKey || nk === normKeyNoPrefix) aliasSets.push(arr);
    });
    aliasSets.flat().forEach(a => {
      pushUnique(a);
      pushUnique(compact(a));
      pushUnique(tight(a));
    });

    return baseList;
  }
}


  