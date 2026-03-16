import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface BlogPost {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  fullContent?: string;
}

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})
export class BlogComponent {
  activeBlog: string | null = null;

  featuredBlog = {
    id: 'bat-trang-700-nam',
    title: 'Bát Tràng – 700 năm giữ nghề gốm',
    description: 'Làng gốm Bát Tràng với bề dày lịch sử hơn 700 năm, nơi lưu giữ tinh hoa nghề gốm truyền thống Việt Nam. Từ những bàn tay nghệ nhân, mỗi sản phẩm gốm không chỉ là đồ dùng mà còn là tác phẩm nghệ thuật mang đậm văn hóa dân tộc.',
    image: 'assets/blog-featured-middle.png',
    date: 'ngày 25 tháng 06, 2022'
  };

  /** Tin nổi bật - left column (4 items to match Tin mới nhất) */
  featuredSmall = [
    { id: 'tu-dat-thanh-hinh', title: 'Từ đất thành hình', image: 'assets/blog-image-39254299-ecd3-4e35-9639-800f9dfc1d57.png', date: 'tháng 03, 2004' },
    { id: 'giu-nghe-hay-giu-ky-uc', title: 'Giữ nghề hay giữ ký ức?', image: 'assets/blog-image-620cef72-fb04-41e6-bbc1-a88d625d7383.png', date: 'tháng 10, 2021' },
    { id: 'khong-hoan-hao', title: 'Không hoàn hảo mới là thủ công', image: 'assets/blog-image-d14c99d8-0624-4fbf-95a2-b214ee73c150.png', date: 'tháng 01, 2025' },
    { id: 'mot-doi-mot-nghe', title: 'Một đời - Một nghề', image: 'assets/blog-image-e2d67ab0-8b2b-4698-a2b8-e46f77692467.png', date: 'tháng 01, 2022' }
  ];

  latestNews = [
    { id: 'doi-tay-nhuom-mau', title: 'Đôi tay nhuộm màu thời gian', image: 'assets/blog-image-a816a0d3-3229-4753-a8c7-7e7baab88866.png', date: 'tháng 01, 2026', desc: 'Câu chuyện về đôi bàn tay gắn bó với nghề qua năm tháng.' },
    { id: 'gom-chu-dau', title: 'Gốm Chu Đậu - Hành trình trở lại', image: 'assets/blog-image-dfb21c3a-e65c-472b-baea-7e6635dd2f22.png', date: 'tháng 01, 2026', desc: 'Hành trình phục hưng dòng gốm Chu Đậu từ quá khứ.' },
    { id: 'son-mai-tuong-binh-hiep', title: 'Sơn mài Tương Bình Hiệp - Lớp màu của thời gian', image: 'assets/blog-image-e96eec76-0d78-44b8-881d-fd40494c5794.png', date: 'tháng 12, 2025', desc: 'Lớp sơn mài chồng lớp qua năm tháng, tạo nên vẻ đẹp độc đáo.' },
    { id: 'hanh-trinh-non-la', title: 'Hành trình của một chiếc nón lá', image: 'assets/blog-image-63db5e9d-dc5b-4be4-be13-79c739fbdd73.png', date: 'tháng 12, 2025', desc: 'Từ lá đến nón, hành trình của nghề truyền thống.' }
  ];

  artisanStories = [
    { id: 'doi-tay-nhuom-mau', title: 'Đôi tay nhuộm màu thời gian', image: 'assets/blog-image-a816a0d3-3229-4753-a8c7-7e7baab88866.png', date: 'tháng 01, 2026', desc: 'Ở Vạn Phúc bà Lê Thị Hòa vẫn kiên trì ngồi bên khung cửi. Bàn tay bà đã quen với nhịp đều đặn suốt ba thập kỷ.' },
    { id: 'son-mai-tuong-binh-hiep', title: 'Sơn mài Tương Bình Hiệp - Lớp màu của thời gian', image: 'assets/blog-image-e96eec76-0d78-44b8-881d-fd40494c5794.png', date: 'tháng 12, 2025', desc: 'Gia đình ông giữ lửa tại Tương Bình Hiệp đã ba đời làm sơn mài. Ông kể rằng để hoàn thành một tác phẩm, phải mài đến hàng chục lớp...' },
    { id: 'nguoi-giu-lua-lo-gom', title: 'Người giữ lửa lò gốm', image: 'assets/blog-image-14fcb103-5442-4f5b-b41a-40179560049d.png', date: 'tháng 08, 2025', desc: 'Tại Bát Tràng, nghệ nhân Trần Minh đã gắn bó với lò gốm hơn 40 năm. Ông nói rằng làm gốm không chỉ là tạo hình mà là hiểu...' },
    { id: 'tro-ve-de-tiep-noi', title: 'Trở về để tiếp nối', image: 'assets/blog-image-53f5fb1b-b202-4137-9a5c-cd716fba7ee8.png', date: 'tháng 07, 2025', desc: 'Nhiều người về làng từ thành phố học tập, nay quay về mở xưởng nhỏ tại quê nhà.' }
  ];

  craftVillageStories = [
    { id: 'khong-hoan-hao', title: 'Không hoàn hảo mới là thủ công', image: 'assets/blog-image-d14c99d8-0624-4fbf-95a2-b214ee73c150.png', date: 'tháng 01, 2025', desc: 'Khác với sản xuất công nghiệp, mỗi sản phẩm thủ công có thể có một sai lệch nhỏ. Nhưng chính sự khác biệt đó tạo nên giá trị...' },
    { id: 'giua-lang-va-pho', title: 'Giữa làng và phố', image: 'assets/blog-image-99c9a690-24cd-4c18-b4b8-4d99a47a28a3.png', date: 'tháng 12, 2025', desc: 'Làng nghề năm nay không còn khép kín. Sản phẩm thủ công đang bước vào không gian hiện đại, kết nối truyền thống với nhiều...' },
    { id: 'mot-doi-mot-nghe', title: 'Một đời - Một nghề', image: 'assets/blog-image-e2d67ab0-8b2b-4698-a2b8-e46f77692467.png', date: 'tháng 01, 2022', desc: 'Có những người dành trọn cả cuộc đời cho một công việc duy nhất. Nghề truyền thống với họ không chỉ là kỹ năng, mà là...' },
    { id: 'giu-nghe-hay-giu-ky-uc', title: 'Giữ nghề hay giữ ký ức?', image: 'assets/blog-image-620cef72-fb04-41e6-bbc1-a88d625d7383.png', date: 'tháng 10, 2021', desc: 'Giữa nhịp sống hiện đại, nhiều nghệ nhân vẫn chọn ở lại với lò gốm, khung cửi, bàn đục. Với họ, giữ nghề không chỉ là mưu sinh...' }
  ];

  blogs: BlogPost[] = [
    {
      id: 'che-tan-cuong',
      title: '🌟 CHÈ TÂN CƯƠNG – LINH HỒN CỦA ĐẤT TRÀ THÁI NGUYÊN',
      description: 'Vùng đất Tân Cương – nơi hội tụ khí hậu và thổ nhưỡng hoàn hảo cho cây chè. Quy trình sao chè truyền thống giúp giữ hương cốm non và vị ngọt hậu độc đáo...',
      image: '/assets/provinces/Thái Nguyên.jpg',
      date: '15/01/2025'
    },
    {
      id: 'mam-ca-linh-ca-mau',
      title: '🐟 MẮM CÁ LINH CÀ MAU – HƯƠNG VỊ MÙA NƯỚC NỔI MIỀN TÂY',
      description: 'Khi mùa nước nổi tràn về, người dân háo hức đón mùa cá linh – "lộc trời ban" của vùng sông nước. Mắm cá linh Cà Mau mang trọn hương vị đồng quê và bản sắc miền Tây...',
      image: '/assets/mắm cá linh.jpg',
      date: '14/01/2025'
    },
    {
      id: 'ca-com-say-gion-nghe-an',
      title: '🐟 CÁ CƠM SẤY GIÒN NGHỆ AN – VỊ BIỂN MẶN MÀ, GIÒN TAN TRÊN ĐẦU LƯỠI',
      description: 'Đặc sản tuyệt vời từ biển Cửa Lò. Từng con cá cơm nhỏ, qua công nghệ chế biến hiện đại, trở thành món ăn giòn tan, đậm vị và đầy dinh dưỡng...',
      image: '/assets/cá cơm sấy giòn.jpg',
      date: '13/01/2025'
    },
    {
      id: 'nuoc-mam-phan-thiet',
      title: '🏝️ NƯỚC MẮM PHAN THIẾT – HƯƠNG VỊ ĐẬM ĐÀ TỪ BIỂN CÁT VÀ NẮNG GIÓ',
      description: 'Biểu tượng của nghề biển lâu đời hơn 300 năm. Hương thơm nồng đậm, vị mặn mòi hòa quyện cùng vị ngọt hậu đặc trưng, nước mắm Phan Thiết là linh hồn ẩm thực miền Trung...',
      image: '/assets/nước mắm.jpg',
      date: '12/01/2025'
    },
    {
      id: 'mat-ong-mau-son',
      title: '🍯 MẬT ONG MẪU SƠN – GIỌT NGỌT TINH KHIẾT TỪ ĐỈNH NÚI LẠNG SƠN',
      description: 'Trên độ cao hơn 1.000 mét của dãy Mẫu Sơn, nơi sương mù bao phủ quanh năm, những đàn ong rừng tạo nên mật ong Mẫu Sơn – đặc sản quý hiếm miền núi phía Bắc...',
      image: '/assets/mật ong mẫu sơn.jpg',
      date: '11/01/2025'
    },
    {
      id: 'giai-thuong-thuong-hieu-quoc-gia',
      title: '🏆 ĐẶC SẢN VIỆT NAM VINH DANH TẠI GIẢI THƯỞNG "THƯƠNG HIỆU QUỐC GIA 2025"',
      description: 'Nhiều sản phẩm đặc sản Việt Nam được vinh danh tại Giải thưởng Thương hiệu Quốc gia – chương trình do Bộ Công Thương tổ chức. Nước mắm Phú Quốc, Trà Tân Cương, Cà phê Buôn Ma Thuột...',
      image: '/assets/price.jpg',
      date: '10/01/2025'
    },
    {
      id: 'lap-xuong-hun-khoi-sapa',
      title: '🐂 LẠP XƯỞNG HUN KHÓI SA PA – ẨM THỰC TÂY BẮC TRONG TỪNG THỚ THỊT',
      description: 'Giữa cái lạnh quanh năm của Sa Pa, lạp xưởng hun khói ra đời như cách người dân giữ thịt qua mùa đông. Ướp với rượu ngô, mắc khén và hun bằng khói củi nghiến...',
      image: '/assets/lạp xưởng hun khói.jpg',
      date: '09/01/2025'
    },
    {
      id: 'ruou-ngo-na-hang',
      title: '🍯 RƯỢU NGÔ NA HANG – HƯƠNG MEN LÁ CỦA NÚI RỪNG TUYÊN QUANG',
      description: 'Ở vùng núi Na Hang, rượu không chỉ là thức uống mà còn là linh hồn văn hóa người Tày và Dao. Rượu ngô được nấu từ ngô bản địa và men lá với 20 loại thảo mộc quý...',
      image: '/assets/rượu ngô.png',
      date: '08/01/2025'
    }
  ];

  constructor(private router: Router) {}

  showBlogDetails(blogId: string): void {
    this.activeBlog = blogId;
  }

  viewBlogDetail(blogId: string): void {
    // Scroll to top then navigate
    window.scrollTo(0, 0);
    this.activeBlog = blogId;
  }

  showBlogList(): void {
    this.activeBlog = null;
    window.scrollTo(0, 0);
  }

  /** Get blog item for new craft-village ids (featured, latest, artisan, craft) */
  getActiveBlogItem(): { title: string; image: string; date: string; desc?: string } | null {
    if (!this.activeBlog) return null;
    if (this.featuredBlog.id === this.activeBlog) {
      return { title: this.featuredBlog.title, image: this.featuredBlog.image, date: this.featuredBlog.date, desc: this.featuredBlog.description };
    }
    const fromLatest = this.latestNews.find(b => b.id === this.activeBlog);
    if (fromLatest) return { ...fromLatest, desc: fromLatest.desc || fromLatest.title };
    const fromArtisan = this.artisanStories.find(b => b.id === this.activeBlog);
    if (fromArtisan) return fromArtisan;
    const fromCraft = this.craftVillageStories.find(b => b.id === this.activeBlog);
    if (fromCraft) return fromCraft;
    const fromFeaturedSmall = this.featuredSmall.find(b => b.id === this.activeBlog);
    if (fromFeaturedSmall) return { ...fromFeaturedSmall, desc: fromFeaturedSmall.title };
    return null;
  }

  isNewBlogId(): boolean {
    return !!this.getActiveBlogItem();
  }
}
