import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  faqs = [
    {
      question: 'Đặc sản 3 miền có gì khác biệt?',
      answer: 'Mỗi miền có đặc sản riêng phản ánh văn hóa và khí hậu vùng đất: Miền Bắc nổi bật với phở Hà Nội, bún chả, chả cá, bánh đậu xanh và trà Tân Cương thơm ngon. Miền Trung mang hương vị đậm đà với bún bò Huế, mì Quảng, cao lầu, nem nướng Nha Trang và hải sản tươi ngon. Miền Nam sôi động với bánh tráng, cơm tấm, hủ tiếu, nước mắm Phú Quốc và trái cây nhiệt đới thơm ngọt. Chúng tôi tự hào mang đến tinh hoa ẩm thực cả nước đến tay bạn.',
      open: false
    },
    {
      question: 'Sản phẩm đặc sản có đảm bảo nguồn gốc xuất xứ không?',
      answer: 'Tất cả sản phẩm tại Đặc Sản 3 Miền đều được tuyển chọn kỹ lưỡng từ các địa phương nổi tiếng, đảm bảo 100% nguồn gốc xuất xứ rõ ràng và có chứng nhận chất lượng. Chúng tôi hợp tác trực tiếp với các nhà sản xuất uy tín tại từng vùng miền, cam kết mang đến sản phẩm chính gốc, giữ nguyên hương vị truyền thống đặc trưng của từng địa phương.',
      open: false
    },
    {
      question: 'Làm sao để bảo quản đặc sản được lâu và giữ nguyên hương vị?',
      answer: 'Tùy vào từng loại đặc sản mà có cách bảo quản khác nhau: Sản phẩm khô như chè, mắc khén, khô cá nên để nơi khô ráo, thoáng mát, tránh ánh nắng trực tiếp. Đặc sản tươi sống như hải sản, nem chua nên bảo quản trong ngăn mát tủ lạnh và sử dụng trong thời gian ngắn. Nước mắm, mật ong, tương ớt nên đậy kín nắp sau khi sử dụng. Chúng tôi luôn kèm theo hướng dẫn chi tiết cho từng sản phẩm để bạn có thể thưởng thức đúng chất lượng nhất.',
      open: false
    },
    {
      question: 'Thời gian giao hàng đặc sản mất bao lâu?',
      answer: 'Với các sản phẩm khô, chúng tôi giao hàng toàn quốc trong vòng 2-5 ngày làm việc. Đối với đặc sản tươi sống và dễ hỏng, chúng tôi có dịch vụ giao hàng nhanh trong 24-48 giờ tại các thành phố lớn, được đóng gói cẩn thận với bao bì chuyên dụng và túi giữ lạnh để đảm bảo chất lượng tốt nhất. Ngoài ra, chúng tôi cũng hỗ trợ giao hàng hỏa tốc cho các đơn hàng cần gấp.',
      open: false
    },
    {
      question: 'Tôi không biết chọn đặc sản gì làm quà, có được tư vấn không?',
      answer: 'Chúng tôi hoàn toàn sẵn sàng tư vấn và hỗ trợ bạn chọn lựa đặc sản phù hợp nhất! Đội ngũ của chúng tôi am hiểu sâu về văn hóa ẩm thực từng vùng miền và có thể gợi ý các món quà đặc sản tinh tế tùy theo mục đích sử dụng: quà biếu sếp, tặng người thân, quà lưu niệm, hay đơn giản là thưởng thức trong gia đình. Bạn có thể liên hệ qua hotline hoặc để lại tin nhắn, chúng tôi sẽ tư vấn nhiệt tình và chi tiết nhất.',
      open: false
    }
  ];

  @ViewChildren('faqItem') faqItems!: QueryList<ElementRef>;

  toggleFaq(faq: any, index: number) {
    faq.open = !faq.open;

    if (faq.open) {
      setTimeout(() => {
        this.faqItems.toArray()[index].nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 0);
    }
  }
}
