// Script to seed sample blogs into MongoDB
require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.DB_NAME || "dacsan3mien";

// Blog data Chuyện làng nghề – khớp với trang blog hiện tại (featuredBlog, featuredSmall, latestNews, artisanStories, craftVillageStories)
const sampleBlogs = [
  {
    slug: 'bat-trang-700-nam',
    title: 'Bát Tràng – 700 năm giữ nghề gốm',
    description: 'Làng gốm Bát Tràng với bề dày lịch sử hơn 700 năm, nơi lưu giữ tinh hoa nghề gốm truyền thống Việt Nam. Từ những bàn tay nghệ nhân, mỗi sản phẩm gốm không chỉ là đồ dùng mà còn là tác phẩm nghệ thuật mang đậm văn hóa dân tộc.',
    content: `Làng gốm Bát Tràng (Gia Lâm, Hà Nội) là một trong những làng nghề truyền thống lâu đời nhất Việt Nam, với bề dày lịch sử hơn 700 năm. Từ những bàn tay tài hoa của nghệ nhân, mỗi sản phẩm gốm Bát Tràng không chỉ là đồ dùng mà còn là tác phẩm nghệ thuật mang đậm văn hóa dân tộc.

Gốm Bát Tràng nổi tiếng với men ngọc, men nâu, men lam, men rạn... mỗi loại đều thể hiện tinh hoa của nghề gốm Việt. Quy trình làm gốm truyền thống gồm chuốt gốm, trang trí, tráng men, nung lò – mỗi bước đều đòi hỏi sự tỉ mỉ và kinh nghiệm lâu năm.

Ngày nay Bát Tràng vừa giữ nghề truyền thống vừa đổi mới, thu hút du khách và kết nối sản phẩm ra thị trường trong nước và quốc tế. Bát Tràng – 700 năm giữ nghề, là niềm tự hào của làng nghề Việt Nam.`,
    image: '/assets/blog-featured-middle.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2022-06-25'),
    updatedAt: new Date('2022-06-25')
  },
  {
    slug: 'tu-dat-thanh-hinh',
    title: 'Từ đất thành hình',
    description: 'Hành trình từ những nắm đất sét thô sơ đến những tác phẩm gốm tinh xảo, câu chuyện về sự sáng tạo và bền bỉ của người thợ làng nghề.',
    content: `Từ đất thành hình là câu chuyện về hành trình biến đổi kỳ diệu – từ những nắm đất sét thô sơ qua bàn tay nghệ nhân trở thành những tác phẩm gốm tinh xảo. Đây không chỉ là quá trình vật lý mà còn là sự gửi gắm tâm hồn, văn hóa vào từng sản phẩm.

Người thợ gốm phải hiểu đất, chọn đất, nhào nặn và tạo hình với sự kiên nhẫn. Mỗi chi tiết trang trí, mỗi nét men đều thể hiện bản sắc làng nghề. Từ đất thành hình – đó chính là nghệ thuật và sự sáng tạo không ngừng của con người.`,
    image: '/assets/blog-image-39254299-ecd3-4e35-9639-800f9dfc1d57.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2004-03-15'),
    updatedAt: new Date('2004-03-15')
  },
  {
    slug: 'giu-nghe-hay-giu-ky-uc',
    title: 'Giữ nghề hay giữ ký ức?',
    description: 'Giữa nhịp sống hiện đại, nhiều nghệ nhân vẫn chọn ở lại với lò gốm, khung cửi, bàn đục. Với họ, giữ nghề không chỉ là mưu sinh...',
    content: `Giữa nhịp sống hiện đại hối hả, nhiều nghệ nhân vẫn chọn ở lại với lò gốm, khung cửi, bàn đục. Với họ, giữ nghề không chỉ là mưu sinh mà còn là gìn giữ ký ức, bản sắc của cha ông.

Câu hỏi "giữ nghề hay giữ ký ức?" đặt ra nhiều suy ngẫm. Nghề truyền thống mang trong mình cả lịch sử, văn hóa và tình cảm. Mỗi sản phẩm thủ công là cầu nối giữa quá khứ và hiện tại. Giữ nghề chính là giữ ký ức – và ngược lại.`,
    image: '/assets/blog-image-620cef72-fb04-41e6-bbc1-a88d625d7383.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2021-10-15'),
    updatedAt: new Date('2021-10-15')
  },
  {
    slug: 'khong-hoan-hao',
    title: 'Không hoàn hảo mới là thủ công',
    description: 'Khác với sản xuất công nghiệp, mỗi sản phẩm thủ công có thể có một sai lệch nhỏ. Nhưng chính sự khác biệt đó tạo nên giá trị...',
    content: `Khác với sản xuất công nghiệp hàng loạt, mỗi sản phẩm thủ công có thể có một sai lệch nhỏ, một nét không đều. Nhưng chính sự "không hoàn hảo" đó mới tạo nên giá trị đích thực của đồ thủ công.

Mỗi chiếc bát, chiếc nón, tấm lụa đều mang dấu ấn riêng của người làm. Không có hai sản phẩm giống hệt nhau – đó là vẻ đẹp của nghề truyền thống. Không hoàn hảo mới là thủ công – sự chân thật, độc đáo mà máy móc không thể tạo ra.`,
    image: '/assets/blog-image-d14c99d8-0624-4fbf-95a2-b214ee73c150.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15')
  },
  {
    slug: 'mot-doi-mot-nghe',
    title: 'Một đời - Một nghề',
    description: 'Có những người dành trọn cả cuộc đời cho một công việc duy nhất. Nghề truyền thống với họ không chỉ là kỹ năng, mà là...',
    content: `Có những người dành trọn cả cuộc đời cho một công việc duy nhất – làm gốm, dệt lụa, đan nón, sơn mài... Nghề truyền thống với họ không chỉ là kỹ năng, mà là đam mê, là lẽ sống.

Một đời một nghề – sự bền bỉ ấy đã tạo nên những nghệ nhân tài hoa, những bậc thầy của làng nghề. Họ truyền nghề cho thế hệ sau, giữ lửa cho di sản văn hóa. Mỗi bàn tay nhăn nheo, mỗi vết chai sạn đều kể câu chuyện về tình yêu nghề.`,
    image: '/assets/blog-image-e2d67ab0-8b2b-4698-a2b8-e46f77692467.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date('2022-01-15')
  },
  {
    slug: 'doi-tay-nhuom-mau',
    title: 'Đôi tay nhuộm màu thời gian',
    description: 'Ở Vạn Phúc bà Lê Thị Hòa vẫn kiên trì ngồi bên khung cửi. Bàn tay bà đã quen với nhịp đều đặn suốt ba thập kỷ.',
    content: `Ở làng lụa Vạn Phúc (Hà Đông, Hà Nội), bà Lê Thị Hòa vẫn kiên trì ngồi bên khung cửi mỗi ngày. Bàn tay bà đã quen với nhịp đều đặn suốt ba thập kỷ – đưa thoi, dệt từng sợi tơ thành những tấm lụa mềm mại.

Đôi tay nhuộm màu thời gian – màu của thuốc nhuộm, của sự cần mẫn. Câu chuyện về đôi bàn tay gắn bó với nghề qua năm tháng, về sự kiên trì và tình yêu với nghề dệt lụa truyền thống. Mỗi tấm lụa Vạn Phúc đều mang hơi ấm của đôi tay ấy.`,
    image: '/assets/blog-image-a816a0d3-3229-4753-a8c7-7e7baab88866.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15')
  },
  {
    slug: 'gom-chu-dau',
    title: 'Gốm Chu Đậu - Hành trình trở lại',
    description: 'Hành trình phục hưng dòng gốm Chu Đậu từ quá khứ, từ những mảnh vỡ khảo cổ đến những tác phẩm làm sống lại thương hiệu gốm cổ.',
    content: `Gốm Chu Đậu (Hải Dương) từng là thương hiệu gốm nổi tiếng thế kỷ 15-17, xuất khẩu sang nhiều nước. Sau hàng trăm năm thất truyền, hành trình phục hưng dòng gốm Chu Đậu bắt đầu từ những mảnh vỡ khảo cổ.

Các nghệ nhân đã nghiên cứu, khôi phục kỹ thuật, men màu, kiểu dáng. Gốm Chu Đậu với men lam, hoa văn tinh xảo đang dần trở lại. Hành trình trở lại – đó là nỗ lực gìn giữ và phát huy di sản gốm cổ Việt Nam.`,
    image: '/assets/blog-image-dfb21c3a-e65c-472b-baea-7e6635dd2f22.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2026-01-10'),
    updatedAt: new Date('2026-01-10')
  },
  {
    slug: 'son-mai-tuong-binh-hiep',
    title: 'Sơn mài Tương Bình Hiệp - Lớp màu của thời gian',
    description: 'Gia đình ông giữ lửa tại Tương Bình Hiệp đã ba đời làm sơn mài. Ông kể rằng để hoàn thành một tác phẩm, phải mài đến hàng chục lớp...',
    content: `Làng sơn mài Tương Bình Hiệp (Bình Dương) nổi tiếng với nghề sơn mài truyền thống. Gia đình ông giữ lửa tại đây đã ba đời làm sơn mài. Ông kể rằng để hoàn thành một tác phẩm, phải quét sơn và mài đến hàng chục lớp.

Lớp sơn mài chồng lớp qua năm tháng, tạo nên độ sâu, độ bóng và vẻ đẹp độc đáo. Mỗi lớp màu ẩn hiện qua lớp mài thể hiện sự công phu. Sơn mài Tương Bình Hiệp – lớp màu của thời gian, là tinh hoa nghề sơn mài Việt Nam.`,
    image: '/assets/blog-image-e96eec76-0d78-44b8-881d-fd40494c5794.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-12-15'),
    updatedAt: new Date('2025-12-15')
  },
  {
    slug: 'hanh-trinh-non-la',
    title: 'Hành trình của một chiếc nón lá',
    description: 'Từ lá đến nón, hành trình của nghề truyền thống. Mỗi chiếc nón lá đều kể câu chuyện về bàn tay khéo léo của người thợ.',
    content: `Từ lá cọ, lá dừa đến chiếc nón lá hoàn chỉnh – đó là hành trình của nghề truyền thống. Các làng nón như Chuông (Hà Tây), Tây Hồ (Huế) vẫn giữ cách làm thủ công: chọn lá, là lá, khâu từng mũi kim.

Mỗi chiếc nón lá đều kể câu chuyện về bàn tay khéo léo, về sự kiên nhẫn của người thợ. Hành trình của một chiếc nón – cũng là hành trình của văn hóa Việt, từ làng quê đến khắp nơi trên thế giới.`,
    image: '/assets/blog-image-63db5e9d-dc5b-4be4-be13-79c739fbdd73.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-12-10'),
    updatedAt: new Date('2025-12-10')
  },
  {
    slug: 'nguoi-giu-lua-lo-gom',
    title: 'Người giữ lửa lò gốm',
    description: 'Tại Bát Tràng, nghệ nhân Trần Minh đã gắn bó với lò gốm hơn 40 năm. Ông nói rằng làm gốm không chỉ là tạo hình mà là hiểu...',
    content: `Tại làng gốm Bát Tràng, nghệ nhân Trần Minh đã gắn bó với lò gốm hơn 40 năm. Ông nói rằng làm gốm không chỉ là tạo hình mà là hiểu đất, hiểu lửa, hiểu từng giai đoạn nung.

Người giữ lửa lò gốm – nhiệm vụ quan trọng nhất. Nhiệt độ, thời gian nung quyết định chất lượng từng mẻ gốm. Ông truyền nghề cho con cháu, giữ ngọn lửa không bao giờ tắt. Mỗi lò gốm cháy đỏ là một câu chuyện về sự tận tâm với nghề.`,
    image: '/assets/blog-image-14fcb103-5442-4f5b-b41a-40179560049d.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-08-15')
  },
  {
    slug: 'tro-ve-de-tiep-noi',
    title: 'Trở về để tiếp nối',
    description: 'Nhiều người về làng từ thành phố học tập, nay quay về mở xưởng nhỏ tại quê nhà, tiếp nối nghề truyền thống của gia đình.',
    content: `Nhiều bạn trẻ rời làng lên thành phố học tập, làm việc. Nhưng rồi họ chọn quay về – mở xưởng nhỏ tại quê nhà, tiếp nối nghề truyền thống của gia đình.

Trở về để tiếp nối – đó là sự lựa chọn của thế hệ mới, mang kiến thức hiện đại để bảo tồn và phát triển nghề truyền thống. Họ kết nối làng nghề với thị trường, đưa sản phẩm thủ công đến gần hơn với người tiêu dùng. Hy vọng mới cho làng nghề Việt Nam.`,
    image: '/assets/blog-image-53f5fb1b-b202-4137-9a5c-cd716fba7ee8.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-07-15'),
    updatedAt: new Date('2025-07-15')
  },
  {
    slug: 'giua-lang-va-pho',
    title: 'Giữa làng và phố',
    description: 'Làng nghề năm nay không còn khép kín. Sản phẩm thủ công đang bước vào không gian hiện đại, kết nối truyền thống với nhiều...',
    content: `Làng nghề năm nay không còn khép kín như trước. Sản phẩm thủ công đang bước vào không gian hiện đại – cửa hàng, triển lãm, sàn thương mại điện tử – kết nối truyền thống với nhiều đối tượng khách hàng hơn.

Giữa làng và phố – ranh giới đang được xóa mờ. Nghệ nhân vừa giữ cách làm truyền thống vừa học cách tiếp cận thị trường. Sản phẩm làng nghề không còn chỉ bán tại chợ quê mà có mặt ở các thành phố lớn, xuất khẩu ra nước ngoài.`,
    image: '/assets/blog-image-99c9a690-24cd-4c18-b4b8-4d99a47a28a3.png',
    author: 'Admin',
    published: true,
    createdAt: new Date('2025-12-20'),
    updatedAt: new Date('2025-12-20')
  }
];

async function seedBlogs() {
  const client = new MongoClient(mongoUri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');
    
    const database = client.db(dbName);
    const blogCollection = database.collection("Blog");
    
    // Check if there are already blogs
    const existingCount = await blogCollection.countDocuments();
    console.log(`\nCurrent number of blogs: ${existingCount}`);
    
    const forceReseed = process.argv.includes('--force') || process.argv.includes('-f');

    if (existingCount > 0) {
      if (forceReseed) {
        console.log('\n--force: Clearing existing blogs...');
        await blogCollection.deleteMany({});
        console.log('Cleared!');
      } else {
        const readline = require('readline').createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          readline.question('\nDatabase already has blogs. Do you want to:\n1. Add more sample blogs\n2. Clear and reseed\n3. Cancel\nYour choice (1/2/3): ', resolve);
        });

        readline.close();

        if (answer === '2') {
          console.log('\nClearing existing blogs...');
          await blogCollection.deleteMany({});
          console.log('Cleared!');
        } else if (answer === '3') {
          console.log('\nOperation cancelled.');
          return;
        }
      }
    }
    
    console.log('\nInserting sample blogs...');
    const result = await blogCollection.insertMany(sampleBlogs);
    
    console.log(`\n✅ Successfully inserted ${result.insertedCount} blogs!`);
    console.log('\n📚 Sample blogs added:');
    sampleBlogs.forEach((blog, index) => {
      console.log(`   ${index + 1}. ${blog.title}`);
    });
    
    console.log('\n✨ You can now view these blogs in the admin panel!');
    console.log('   URL: http://localhost:4200/admin/blog-adm\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

if (require.main === module) {
  seedBlogs();
}

module.exports = {
  sampleBlogs,
  seedBlogs
};
