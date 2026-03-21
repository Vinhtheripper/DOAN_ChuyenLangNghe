function buildKnowledgeContext(knowledge) {
  const sections = [];

  if (knowledge.products.length > 0) {
    sections.push([
      'SAN PHAM LIEN QUAN:',
      ...knowledge.products.map((product, index) => {
        const price = typeof product.unit_price === 'number' ? `${product.unit_price} VND` : 'Khong ro gia';
        const discount = typeof product.discount === 'number' && product.discount > 0
          ? `, giam gia: ${Math.round(product.discount * 100)}%`
          : '';
        return `${index + 1}. ${product.product_name} | danh muc: ${product.product_dept || 'khong ro'} | loai: ${product.type || 'khong ro'} | gia: ${price}${discount} | ton kho: ${product.stocked_quantity ?? 'khong ro'} | mo ta: ${product.product_detail || 'khong co mo ta'}`;
      })
    ].join('\n'));
  }

  if (knowledge.blogs.length > 0) {
    sections.push([
      'BAI VIET LIEN QUAN:',
      ...knowledge.blogs.map((blog, index) => (
        `${index + 1}. ${blog.title} | mo ta: ${blog.description || 'khong co mo ta'} | noi dung: ${blog.content || 'khong co noi dung'}`
      ))
    ].join('\n'));
  }

  if (knowledge.coupons.length > 0) {
    sections.push([
      'KHUYEN MAI LIEN QUAN:',
      ...knowledge.coupons.map((coupon, index) => (
        `${index + 1}. Ma ${coupon.code} | giam: ${coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `${coupon.discountValue} VND`} | hoat dong: ${coupon.isActive ? 'co' : 'khong'}`
      ))
    ].join('\n'));
  }

  return sections.join('\n\n');
}

function buildSystemInstruction(knowledge) {
  const knowledgeContext = buildKnowledgeContext(knowledge);

  return [
    'Ban la tro ly AI cua website Chuyen Lang Nghe.',
    'Nhiem vu: tra loi ngan gon, ro rang, uu tien tieng Viet, dua tren du lieu truy xuat tu he thong.',
    'Neu du lieu khong du, phai noi ro la ban chua thay thong tin xac thuc trong he thong.',
    'Khong duoc tu bo sung chinh sach, gia, ton kho, khuyen mai neu khong co trong du lieu.',
    'Neu co san pham phu hop, uu tien goi y toi da 3 san pham lien quan nhat, moi san pham chi mo ta 1 den 2 cau ngan.',
    'Neu co bai viet lien quan, chi nhac den toi da 2 bai va dien giai y chinh that ngan.',
    'Tra loi than thien nhung thuc dung, tranh khoa truong.',
    'Khong dung markdown phuc tap. Khong viet tieu muc danh so 1, 2, 3 theo kieu dai dong.',
    'Uu tien van ban tu nhien. Neu can liet ke, moi dong chi mot y ngan, bat dau bang dau gach ngang.',
    'Do dai mong muon: thuong tu 3 den 6 dong, khong keo dai qua muc can thiet.',
    'Phai ket thuc tron y, khong bo do cau cuoi.',
    knowledgeContext ? `DU LIEU THAM CHIEU:\n${knowledgeContext}` : 'DU LIEU THAM CHIEU: khong tim thay du lieu lien quan.'
  ].join('\n\n');
}

module.exports = {
  buildSystemInstruction
};
