const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Story = require('./models/storyModel');

dotenv.config();

// Mock data from frontend
const MOCK_STORIES = [
  {
    id: 'thap-co-chi-chu',
    title: 'Tháp Cổ Chi Chủ',
    alias: 'The Ancient Tower Master',
    author: 'Tác giả A',
    description: 'Một câu chuyện phiêu lưu kỳ ảo trong một thế giới nơi những ngọn tháp cổ xưa ẩn chứa sức mạnh vô song. Nhân vật chính trên hành trình khám phá bí mật của tòa tháp và định mệnh của chính mình.',
    coverImage: 'https://picsum.photos/seed/thapco/400/600',
    tags: ['Huyền Huyễn', 'Phiêu Lưu', 'Hành Động'],
    status: 'Đang dịch',
    views: 12500,
    rating: 4.8,
    ratingsCount: 250,
    isHot: true,
    isInBanner: true,
    createdAt: '2024-05-20T10:00:00Z',
    lastUpdatedAt: '2024-05-22T14:30:00Z',
    volumes: [
        {
            id: 'vol-1-thap-co',
            title: 'Tập 1: Tiếng Vọng Của Quá Khứ',
            chapters: [
                { id: '1', title: 'Chương 1: Kẻ Gác Đền', content: 'Màn đêm buông xuống trên thung lũng. Elara, người cuối cùng của dòng dõi gác đền, nhìn lên ngọn tháp cổ kính, bóng của nó trải dài như một ngón tay khổng lồ chỉ thẳng lên bầu trời đầy sao. Đêm nay, một điều gì đó khác lạ đang khuấy động trong không khí.', createdAt: '2024-05-20T11:00:00Z', views: 5200 },
                { id: '2', title: 'Chương 2: Dấu Hiệu Cổ Xưa', content: 'Những ký tự trên cánh cổng đá phát sáng với một ánh sáng xanh mờ ảo. Elara biết rằng đây là dấu hiệu mà các bậc tiền bối đã cảnh báo. Thời khắc thử thách đã đến. Cô siết chặt thanh kiếm bạc trong tay, trái tim đập mạnh trong lồng ngực.', createdAt: '2024-05-21T12:00:00Z', views: 4100 },
                { id: '3', title: 'Chương 3: Tiếng Vọng Từ Vực Thẳm', content: 'Bên trong tháp, không khí lạnh lẽo và đặc quánh. Những tiếng thì thầm vang vọng từ bóng tối, kể về những vinh quang đã mất và những lời nguyền còn sót lại. Elara phải đối mặt với nỗi sợ hãi của chính mình trước khi có thể tiến xa hơn.', createdAt: '2024-05-22T14:30:00Z', views: 3200 },
            ],
        }
    ],
  },
  {
    id: 'kiem-dao-doc-ton',
    title: 'Kiếm Đạo Độc Tôn',
    author: 'Tác giả B',
    description: 'Hành trình của một thiếu niên từ một ngôi làng hẻo lánh trở thành kiếm sĩ mạnh nhất thiên hạ. Với tài năng thiên bẩm và ý chí kiên định, cậu vượt qua mọi thử thách để đạt đến đỉnh cao của kiếm đạo.',
    coverImage: 'https://picsum.photos/seed/kiemdao/400/600',
    tags: ['Kiếm Hiệp', 'Tu Luyện', 'Võ Thuật'],
    status: 'Hoàn thành',
    views: 8900,
    rating: 4.5,
    ratingsCount: 180,
    isHot: false,
    createdAt: '2024-04-15T08:00:00Z',
    lastUpdatedAt: '2024-05-18T10:00:00Z',
    volumes: [
        {
            id: 'vol-1-kiem-dao',
            title: 'Tập 1: Khởi Đầu',
            chapters: [
              { id: '4', title: 'Chương 1: Giấc Mơ Lớn', content: 'Lý Phi Dương chỉ là một cậu bé chăn trâu bình thường, nhưng trong lòng cậu ẩn chứa một giấc mơ vĩ đại: trở thành một kiếm khách lừng danh. Mỗi ngày, sau khi hoàn thành công việc, cậu lại lén lút luyện tập với thanh kiếm gỗ của mình.', createdAt: '2024-04-15T09:00:00Z', views: 5000 },
            ],
        },
        {
            id: 'vol-2-kiem-dao',
            title: 'Tập 2: Kỳ Ngộ',
            chapters: [
              { id: '5', title: 'Chương 2: Kỳ Ngộ', content: 'Trong một lần đuổi theo con trâu đi lạc vào rừng sâu, Lý Phi Dương tình cờ phát hiện một hang động bí ẩn. Bên trong, một bộ xương khô ngồi xếp bằng, bên cạnh là một thanh cổ kiếm và một quyển bí kíp võ công.', createdAt: '2024-05-18T10:00:00Z', views: 3900 },
            ],
        }
    ],
  },
  {
    id: 'vuong-quoc-bi-an',
    title: 'Vương Quốc Bí Ẩn',
    alias: 'The Mysterious Kingdom',
    author: 'Tác giả C',
    description: 'Một nhà khảo cổ học trẻ tuổi vô tình tìm thấy bản đồ dẫn đến một vương quốc bị lãng quên trong lịch sử. Cô dấn thân vào một cuộc phiêu lưu nguy hiểm, đối mặt với những cạm bẫy cổ xưa và những kẻ săn lùng kho báu.',
    coverImage: 'https://picsum.photos/seed/vuongquoc/400/600',
    tags: ['Phiêu Lưu', 'Huyền Bí', 'Lịch Sử'],
    status: 'Đang dịch',
    views: 7200,
    rating: 4.2,
    ratingsCount: 95,
    isHot: true,
    isInBanner: true,
    createdAt: '2024-05-21T11:00:00Z',
    lastUpdatedAt: '2024-05-21T11:00:00Z',
    volumes: [
        {
            id: 'vol-1-vuong-quoc',
            title: 'Tập 1',
            chapters: [
              { id: '6', title: 'Chương 1: Tấm Bản Đồ Da Cừu', content: 'Tiến sĩ An Khê không thể tin vào mắt mình. Tấm bản đồ da cừu cũ nát mà cô mua được từ một khu chợ trời ở Cairo lại chứa đựng những tọa độ không tồn tại trên bất kỳ bản đồ hiện đại nào. Một vương quốc đã mất? Hay chỉ là một trò lừa bịp tinh vi?', createdAt: '2024-05-21T11:00:00Z', views: 7200 },
            ],
        }
    ],
  },
];

const importData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Clear existing data
        await Story.deleteMany();
        console.log('Cleared existing data');

        // Insert mock data
        const storiesToInsert = MOCK_STORIES.map(story => {
            // Remove _id if it exists and let Mongoose generate new ones
            const { _id, ...rest } = story;
            return rest;
        });

        await Story.insertMany(storiesToInsert);
        console.log('✅ Data imported successfully!');
        
        // Disconnect from database
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error importing data:', error);
        process.exit(1);
    }
};

importData(); 