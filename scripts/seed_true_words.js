const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const wordsDB = [
  // A1 (40)
  { english: "hello", vietnamese: "xin chào", level: "A1", ipa: "/həˈləʊ/", example: "Hello, how are you?" },
  { english: "goodbye", vietnamese: "tạm biệt", level: "A1", ipa: "/ɡʊdˈbaɪ/", example: "Goodbye, see you later!" },
  { english: "thank you", vietnamese: "cảm ơn", level: "A1", ipa: "/θæŋk juː/", example: "Thank you for your help." },
  { english: "please", vietnamese: "làm ơn", level: "A1", ipa: "/pliːz/", example: "Could you help me, please?" },
  { english: "yes", vietnamese: "vâng, có", level: "A1", ipa: "/jes/", example: "Yes, I understand." },
  { english: "no", vietnamese: "không", level: "A1", ipa: "/nəʊ/", example: "No, thank you." },
  { english: "cat", vietnamese: "con mèo", level: "A1", ipa: "/kæt/", example: "The cat is sleeping." },
  { english: "dog", vietnamese: "con chó", level: "A1", ipa: "/dɒɡ/", example: "I have a pet dog." },
  { english: "house", vietnamese: "ngôi nhà", level: "A1", ipa: "/haʊs/", example: "They live in a big house." },
  { english: "car", vietnamese: "ô tô", level: "A1", ipa: "/kɑːr/", example: "He drives a red car." },
  { english: "book", vietnamese: "quyển sách", level: "A1", ipa: "/bʊk/", example: "I am reading a good book." },
  { english: "water", vietnamese: "nước", level: "A1", ipa: "/ˈwɔːtər/", example: "Can I have some water?" },
  { english: "food", vietnamese: "thức ăn", level: "A1", ipa: "/fuːd/", example: "The food is delicious." },
  { english: "apple", vietnamese: "quả táo", level: "A1", ipa: "/ˈæpl/", example: "She ate an apple." },
  { english: "day", vietnamese: "ngày", level: "A1", ipa: "/deɪ/", example: "It is a beautiful day." },
  { english: "night", vietnamese: "đêm", level: "A1", ipa: "/naɪt/", example: "The stars shine at night." },
  { english: "morning", vietnamese: "buổi sáng", level: "A1", ipa: "/ˈmɔːnɪŋ/", example: "Good morning!" },
  { english: "friend", vietnamese: "bạn bè", level: "A1", ipa: "/frend/", example: "He is my best friend." },
  { english: "family", vietnamese: "gia đình", level: "A1", ipa: "/ˈfæməli/", example: "I love my family." },
  { english: "name", vietnamese: "tên", level: "A1", ipa: "/neɪm/", example: "What is your name?" },
  { english: "time", vietnamese: "thời gian", level: "A1", ipa: "/taɪm/", example: "What time is it?" },
  { english: "money", vietnamese: "tiền", level: "A1", ipa: "/ˈmʌni/", example: "I don't have much money." },
  { english: "work", vietnamese: "làm việc", level: "A1", ipa: "/wɜːrk/", example: "I go to work every day." },
  { english: "school", vietnamese: "trường học", level: "A1", ipa: "/skuːl/", example: "Kids go to school." },
  { english: "teacher", vietnamese: "giáo viên", level: "A1", ipa: "/ˈtiːtʃər/", example: "My teacher is very kind." },
  { english: "student", vietnamese: "học sinh", level: "A1", ipa: "/ˈstjuːdnt/", example: "She is a university student." },
  { english: "country", vietnamese: "quốc gia", level: "A1", ipa: "/ˈkʌntri/", example: "Which country are you from?" },
  { english: "city", vietnamese: "thành phố", level: "A1", ipa: "/ˈsɪti/", example: "New York is a big city." },
  { english: "road", vietnamese: "con đường", level: "A1", ipa: "/rəʊd/", example: "The road is very long." },
  { english: "tree", vietnamese: "cái cây", level: "A1", ipa: "/triː/", example: "There is a tall tree here." },
  { english: "sun", vietnamese: "mặt trời", level: "A1", ipa: "/sʌn/", example: "The sun is hot." },
  { english: "moon", vietnamese: "mặt trăng", level: "A1", ipa: "/muːn/", example: "Look at the full moon." },
  { english: "star", vietnamese: "ngôi sao", level: "A1", ipa: "/stɑːr/", example: "I can see a bright star." },
  { english: "color", vietnamese: "màu sắc", level: "A1", ipa: "/ˈkʌlər/", example: "What is your favorite color?" },
  { english: "red", vietnamese: "màu đỏ", level: "A1", ipa: "/red/", example: "The apple is red." },
  { english: "blue", vietnamese: "màu xanh dương", level: "A1", ipa: "/bluː/", example: "The sky is blue." },
  { english: "green", vietnamese: "màu xanh lá", level: "A1", ipa: "/ɡriːn/", example: "The grass is green." },
  { english: "happy", vietnamese: "vui vẻ", level: "A1", ipa: "/ˈhæpi/", example: "I feel very happy today." },
  { english: "sad", vietnamese: "buồn", level: "A1", ipa: "/sæd/", example: "Why are you sad?" },
  { english: "angry", vietnamese: "tức giận", level: "A1", ipa: "/ˈæŋɡri/", example: "He is angry about the mistake." },

  // A2 (40)
  { english: "beautiful", vietnamese: "đẹp", level: "A2", ipa: "/ˈbjuːtɪfl/", example: "She is a beautiful girl." },
  { english: "ugly", vietnamese: "xấu xí", level: "A2", ipa: "/ˈʌɡli/", example: "That is an ugly building." },
  { english: "fast", vietnamese: "nhanh", level: "A2", ipa: "/fɑːst/", example: "He runs very fast." },
  { english: "slow", vietnamese: "chậm", level: "A2", ipa: "/sləʊ/", example: "The turtle is slow." },
  { english: "big", vietnamese: "to lớn", level: "A2", ipa: "/bɪɡ/", example: "They live in a big house." },
  { english: "small", vietnamese: "nhỏ", level: "A2", ipa: "/smɔːl/", example: "I want a small cup of tea." },
  { english: "hot", vietnamese: "nóng", level: "A2", ipa: "/hɒt/", example: "It's very hot in summer." },
  { english: "cold", vietnamese: "lạnh", level: "A2", ipa: "/kəʊld/", example: "The winter is cold here." },
  { english: "warm", vietnamese: "ấm áp", level: "A2", ipa: "/wɔːm/", example: "I like warm weather." },
  { english: "cool", vietnamese: "mát mẻ", level: "A2", ipa: "/kuːl/", example: "It is cool outside." },
  { english: "easy", vietnamese: "dễ dàng", level: "A2", ipa: "/ˈiːzi/", example: "The test was easy." },
  { english: "hard", vietnamese: "khó khăn", level: "A2", ipa: "/hɑːd/", example: "Math is hard for me." },
  { english: "light", vietnamese: "ánh sáng / nhẹ", level: "A2", ipa: "/laɪt/", example: "Turn on the light." },
  { english: "heavy", vietnamese: "nặng", level: "A2", ipa: "/ˈhevi/", example: "This box is heavy." },
  { english: "strong", vietnamese: "mạnh mẽ", level: "A2", ipa: "/strɒŋ/", example: "He is a strong man." },
  { english: "weak", vietnamese: "yếu đuối", level: "A2", ipa: "/wiːk/", example: "I feel weak after being sick." },
  { english: "rich", vietnamese: "giàu có", level: "A2", ipa: "/rɪtʃ/", example: "He wants to be rich." },
  { english: "poor", vietnamese: "nghèo", level: "A2", ipa: "/pʊər/", example: "They help poor people." },
  { english: "young", vietnamese: "trẻ", level: "A2", ipa: "/jʌŋ/", example: "She is very young." },
  { english: "old", vietnamese: "già / cũ", level: "A2", ipa: "/əʊld/", example: "My grandfather is old." },
  { english: "new", vietnamese: "mới", level: "A2", ipa: "/njuː/", example: "I bought a new phone." },
  { english: "clean", vietnamese: "sạch sẽ", level: "A2", ipa: "/kliːn/", example: "Keep your room clean." },
  { english: "dirty", vietnamese: "bẩn thỉu", level: "A2", ipa: "/ˈdɜːti/", example: "My shoes are dirty." },
  { english: "right", vietnamese: "đúng / bên phải", level: "A2", ipa: "/raɪt/", example: "You are right." },
  { english: "wrong", vietnamese: "sai", level: "A2", ipa: "/rɒŋ/", example: "That answer is wrong." },
  { english: "true", vietnamese: "đúng sự thật", level: "A2", ipa: "/truː/", example: "Is that true?" },
  { english: "false", vietnamese: "sai sự thật", level: "A2", ipa: "/fɔːls/", example: "True or false questions." },
  { english: "near", vietnamese: "gần", level: "A2", ipa: "/nɪər/", example: "The shop is near my house." },
  { english: "far", vietnamese: "xa", level: "A2", ipa: "/fɑːr/", example: "She lives far away." },
  { english: "early", vietnamese: "sớm", level: "A2", ipa: "/ˈɜːli/", example: "I wake up early." },
  { english: "late", vietnamese: "muộn", level: "A2", ipa: "/leɪt/", example: "Don't be late for work." },
  { english: "open", vietnamese: "mở", level: "A2", ipa: "/ˈəʊpən/", example: "Please open the door." },
  { english: "close", vietnamese: "đóng", level: "A2", ipa: "/kləʊz/", example: "Close your books, please." },
  { english: "start", vietnamese: "bắt đầu", level: "A2", ipa: "/stɑːt/", example: "Let's start the meeting." },
  { english: "stop", vietnamese: "dừng lại", level: "A2", ipa: "/stɒp/", example: "Stop talking!" },
  { english: "play", vietnamese: "chơi", level: "A2", ipa: "/pleɪ/", example: "I like to play football." },
  { english: "work", vietnamese: "làm việc", level: "A2", ipa: "/wɜːrk/", example: "She works hard." },
  { english: "study", vietnamese: "học tập", level: "A2", ipa: "/ˈstʌdi/", example: "I study English every day." },
  { english: "learn", vietnamese: "học", level: "A2", ipa: "/lɜːn/", example: "I want to learn French." },
  { english: "read", vietnamese: "đọc", level: "A2", ipa: "/riːd/", example: "I love to read books." },

  // B1 (40)
  { english: "adventure", vietnamese: "cuộc phiêu lưu", level: "B1", ipa: "/ədˈventʃər/", example: "We went on an exciting adventure." },
  { english: "celebrate", vietnamese: "ăn mừng", level: "B1", ipa: "/ˈselɪbreɪt/", example: "Let's celebrate your birthday!" },
  { english: "decision", vietnamese: "quyết định", level: "B1", ipa: "/dɪˈsɪʒn/", example: "It was a hard decision to make." },
  { english: "environment", vietnamese: "môi trường", level: "B1", ipa: "/ɪnˈvaɪrənmənt/", example: "We must protect the environment." },
  { english: "experience", vietnamese: "kinh nghiệm", level: "B1", ipa: "/ɪkˈspɪəriəns/", example: "She has a lot of experience." },
  { english: "frequent", vietnamese: "thường xuyên", level: "B1", ipa: "/ˈfriːkwənt/", example: "He is a frequent visitor here." },
  { english: "government", vietnamese: "chính phủ", level: "B1", ipa: "/ˈɡʌvərnmənt/", example: "The government made a new law." },
  { english: "improve", vietnamese: "cải thiện", level: "B1", ipa: "/ɪmˈpruːv/", example: "I want to improve my speaking skills." },
  { english: "knowledge", vietnamese: "kiến thức", level: "B1", ipa: "/ˈnɒlɪdʒ/", example: "Reading gives you knowledge." },
  { english: "language", vietnamese: "ngôn ngữ", level: "B1", ipa: "/ˈlæŋɡwɪdʒ/", example: "How many languages do you speak?" },
  { english: "machine", vietnamese: "máy móc", level: "B1", ipa: "/məˈʃiːn/", example: "This machine is very loud." },
  { english: "natural", vietnamese: "tự nhiên", level: "B1", ipa: "/ˈnætʃrəl/", example: "It is natural to feel nervous." },
  { english: "opportunity", vietnamese: "cơ hội", level: "B1", ipa: "/ˌɒpəˈtjuːnəti/", example: "This is a great opportunity for you." },
  { english: "patient", vietnamese: "kiên nhẫn", level: "B1", ipa: "/ˈpeɪʃnt/", example: "Please be patient." },
  { english: "quality", vietnamese: "chất lượng", level: "B1", ipa: "/ˈkwɒləti/", example: "The food is of high quality." },
  { english: "reason", vietnamese: "lý do", level: "B1", ipa: "/ˈriːzn/", example: "Give me one good reason to stay." },
  { english: "science", vietnamese: "khoa học", level: "B1", ipa: "/ˈsaɪəns/", example: "I am interested in science." },
  { english: "technology", vietnamese: "công nghệ", level: "B1", ipa: "/tekˈnɒlədʒi/", example: "Technology changes fast." },
  { english: "understand", vietnamese: "hiểu", level: "B1", ipa: "/ˌʌndəˈstænd/", example: "Do you understand me?" },
  { english: "various", vietnamese: "nhiều loại khác nhau", level: "B1", ipa: "/ˈveəriəs/", example: "There are various ways to solve it." },
  { english: "weather", vietnamese: "thời tiết", level: "B1", ipa: "/ˈweðər/", example: "The weather is very nice today." },
  { english: "achieve", vietnamese: "đạt được", level: "B1", ipa: "/əˈtʃiːv/", example: "He wants to achieve his goals." },
  { english: "believe", vietnamese: "tin tưởng", level: "B1", ipa: "/bɪˈliːv/", example: "I believe you can do it." },
  { english: "create", vietnamese: "tạo ra", level: "B1", ipa: "/kriˈeɪt/", example: "She creates beautiful art." },
  { english: "develop", vietnamese: "phát triển", level: "B1", ipa: "/dɪˈveləp/", example: "We need to develop a new plan." },
  { english: "encourage", vietnamese: "khuyến khích", level: "B1", ipa: "/ɪnˈkʌrɪdʒ/", example: "They encouraged him to try again." },
  { english: "forget", vietnamese: "quên", level: "B1", ipa: "/fəˈɡet/", example: "Don't forget your umbrella." },
  { english: "guess", vietnamese: "đoán", level: "B1", ipa: "/ɡes/", example: "Can you guess his age?" },
  { english: "happen", vietnamese: "xảy ra", level: "B1", ipa: "/ˈhæpən/", example: "What happened here?" },
  { english: "imagine", vietnamese: "tưởng tượng", level: "B1", ipa: "/ɪˈmædʒɪn/", example: "Imagine a world without war." },
  { english: "join", vietnamese: "tham gia", level: "B1", ipa: "/dʒɔɪn/", example: "Would you like to join us?" },
  { english: "keep", vietnamese: "giữ", level: "B1", ipa: "/kiːp/", example: "Keep your room tidy." },
  { english: "laugh", vietnamese: "cười", level: "B1", ipa: "/lɑːf/", example: "That joke made everyone laugh." },
  { english: "manage", vietnamese: "quản lý / xoay sở", level: "B1", ipa: "/ˈmænɪdʒ/", example: "How do you manage your time?" },
  { english: "notice", vietnamese: "chú ý", level: "B1", ipa: "/ˈnəʊtɪs/", example: "Did you notice her new haircut?" },
  { english: "offer", vietnamese: "đề nghị", level: "B1", ipa: "/ˈɒfər/", example: "He offered me a job." },
  { english: "promise", vietnamese: "hứa hẹn", level: "B1", ipa: "/ˈprɒmɪs/", example: "I promise to be there." },
  { english: "quit", vietnamese: "từ bỏ", level: "B1", ipa: "/kwɪt/", example: "She quit smoking last year." },
  { english: "realize", vietnamese: "nhận ra", level: "B1", ipa: "/ˈriːəlaɪz/", example: "I didn't realize it was so late." },
  { english: "suggest", vietnamese: "đề xuất", level: "B1", ipa: "/səˈdʒest/", example: "I suggest we go home now." },

  // B2 (40)
  { english: "abstract", vietnamese: "trừu tượng", level: "B2", ipa: "/ˈæbstrækt/", example: "Abstract art is hard to understand." },
  { english: "beneficial", vietnamese: "có ích lợi", level: "B2", ipa: "/ˌbenɪˈfɪʃl/", example: "Exercise is beneficial to health." },
  { english: "capable", vietnamese: "có khả năng", level: "B2", ipa: "/ˈkeɪpəbl/", example: "She is capable of passing the exam." },
  { english: "determine", vietnamese: "xác định", level: "B2", ipa: "/dɪˈtɜːmɪn/", example: "We need to determine the cause." },
  { english: "evaluate", vietnamese: "đánh giá", level: "B2", ipa: "/ɪˈvæljueɪt/", example: "They will evaluate his performance." },
  { english: "flexible", vietnamese: "linh hoạt", level: "B2", ipa: "/ˈfleksəbl/", example: "My work hours are very flexible." },
  { english: "generate", vietnamese: "tạo ra / phát sinh", level: "B2", ipa: "/ˈdʒenəreɪt/", example: "Wind turbines generate electricity." },
  { english: "hesitate", vietnamese: "do dự", level: "B2", ipa: "/ˈhezɪteɪt/", example: "Don't hesitate to call me." },
  { english: "identify", vietnamese: "nhận dạng", level: "B2", ipa: "/aɪˈdentɪfaɪ/", example: "Can you identify the suspect?" },
  { english: "justify", vietnamese: "biện minh", level: "B2", ipa: "/ˈdʒʌstɪfaɪ/", example: "You must justify your actions." },
  { english: "logical", vietnamese: "có hợp lý", level: "B2", ipa: "/ˈlɒdʒɪkl/", example: "That is a logical conclusion." },
  { english: "maintain", vietnamese: "duy trì", level: "B2", ipa: "/meɪnˈteɪn/", example: "We need to maintain high standards." },
  { english: "negotiate", vietnamese: "đàm phán", level: "B2", ipa: "/nɪˈɡəʊʃieɪt/", example: "They are trying to negotiate a deal." },
  { english: "observe", vietnamese: "quan sát", level: "B2", ipa: "/əbˈzɜːv/", example: "She likes to observe people." },
  { english: "participate", vietnamese: "tham gia", level: "B2", ipa: "/pɑːˈtɪsɪpeɪt/", example: "Everyone should participate in class." },
  { english: "qualify", vietnamese: "đủ tiêu chuẩn", level: "B2", ipa: "/ˈkwɒlɪfaɪ/", example: "She needs to qualify for the final." },
  { english: "relevant", vietnamese: "có liên quan", level: "B2", ipa: "/ˈreləvənt/", example: "Provide relevant information only." },
  { english: "significant", vietnamese: "đáng kể", level: "B2", ipa: "/sɪɡˈnɪfɪkənt/", example: "There was a significant improvement." },
  { english: "tolerate", vietnamese: "chịu đựng / tha thứ", level: "B2", ipa: "/ˈtɒləreɪt/", example: "I will not tolerate bad behavior." },
  { english: "unique", vietnamese: "độc nhất", level: "B2", ipa: "/juˈniːk/", example: "Everyone's fingerprint is unique." },
  { english: "valid", vietnamese: "có giá trị / hợp lý", level: "B2", ipa: "/ˈvælɪd/", example: "You must have a valid passport." },
  { english: "widespread", vietnamese: "lan rộng", level: "B2", ipa: "/ˈwaɪdspred/", example: "There is widespread support for him." },
  { english: "accurate", vietnamese: "chính xác", level: "B2", ipa: "/ˈækjərət/", example: "The figures are accurately measured." },
  { english: "brilliant", vietnamese: "rực rỡ / thông minh", level: "B2", ipa: "/ˈbrɪliənt/", example: "What a brilliant idea!" },
  { english: "complex", vietnamese: "phức tạp", level: "B2", ipa: "/ˈkɒmpleks/", example: "It is a complex problem." },
  { english: "deliberate", vietnamese: "cố ý", level: "B2", ipa: "/dɪˈlɪbərət/", example: "It was a deliberate mistake." },
  { english: "efficient", vietnamese: "hiệu quả", level: "B2", ipa: "/ɪˈfɪʃnt/", example: "We need a more efficient system." },
  { english: "fascinating", vietnamese: "hấp dẫn", level: "B2", ipa: "/ˈfæsɪneɪtɪŋ/", example: "The book is absolutely fascinating." },
  { english: "genuine", vietnamese: "chân thật", level: "B2", ipa: "/ˈdʒenjuɪn/", example: "Is this genuine leather?" },
  { english: "hostile", vietnamese: "thù địch", level: "B2", ipa: "/ˈhɒstaɪl/", example: "They were met by a hostile crowd." },
  { english: "inevitable", vietnamese: "không thể tránh khỏi", level: "B2", ipa: "/ɪnˈevɪtəbl/", example: "Change is inevitable." },
  { english: "jealous", vietnamese: "ghen tị", level: "B2", ipa: "/ˈdʒeləs/", example: "She is jealous of his success." },
  { english: "keen", vietnamese: "sắc sảo / nhiệt tình", level: "B2", ipa: "/kiːn/", example: "He is a keen observer." },
  { english: "lonely", vietnamese: "cô đơn", level: "B2", ipa: "/ˈləʊnli/", example: "He felt lonely in the big city." },
  { english: "massive", vietnamese: "to lớn / khổng lồ", level: "B2", ipa: "/ˈmæsɪv/", example: "The castle has massive walls." },
  { english: "nervous", vietnamese: "lo lắng", level: "B2", ipa: "/ˈnɜːvəs/", example: "I get nervous before exams." },
  { english: "obvious", vietnamese: "rõ ràng", level: "B2", ipa: "/ˈɒbviəs/", example: "It's obvious that she is lying." },
  { english: "proud", vietnamese: "tự hào", level: "B2", ipa: "/praʊd/", example: "I am proud of my son." },
  { english: "quiet", vietnamese: "yên tĩnh", level: "B2", ipa: "/ˈkwaɪət/", example: "Please be quiet in the library." },
  { english: "rough", vietnamese: "thô ráp", level: "B2", ipa: "/rʌf/", example: "The road was very rough." },

  // C1 (40)
  { english: "ambiguous", vietnamese: "mơ hồ / khó hiểu", level: "C1", ipa: "/æmˈbɪɡjuəs/", example: "His answer was somewhat ambiguous." },
  { english: "benevolent", vietnamese: "nhân từ", level: "C1", ipa: "/bəˈnevələnt/", example: "A benevolent smile crossed her face." },
  { english: "crucial", vietnamese: "cực kỳ quan trọng", level: "C1", ipa: "/ˈkruːʃl/", example: "It is crucial to act right now." },
  { english: "devastate", vietnamese: "tàn phá", level: "C1", ipa: "/ˈdevəsteɪt/", example: "The city was devastated by the bomb." },
  { english: "eloquent", vietnamese: "hùng hồn", level: "C1", ipa: "/ˈeləkwənt/", example: "She gave an eloquent speech." },
  { english: "flawless", vietnamese: "hoàn hảo / không lỗi", level: "C1", ipa: "/ˈflɔːləs/", example: "Her performance was flawless." },
  { english: "gregarious", vietnamese: "thích giao du", level: "C1", ipa: "/ɡrɪˈɡeəriəs/", example: "He was a fun, gregarious man." },
  { english: "hypothesis", vietnamese: "giả thuyết", level: "C1", ipa: "/haɪˈpɒθəsɪs/", example: "We need data to test the hypothesis." },
  { english: "impeccable", vietnamese: "không tì vết", level: "C1", ipa: "/ɪmˈpekəbl/", example: "He has impeccable taste in music." },
  { english: "juxtapose", vietnamese: "đặt cạnh nhau", level: "C1", ipa: "/ˌdʒʌkstəˈpəʊz/", example: "The exhibition juxtaposes old and new art." },
  { english: "lucid", vietnamese: "rõ ràng / dễ hiểu", level: "C1", ipa: "/ˈluːsɪd/", example: "He gave a lucid explanation." },
  { english: "meticulous", vietnamese: "tỉ mỉ", level: "C1", ipa: "/məˈtɪkjələs/", example: "She is meticulous about her work." },
  { english: "nostalgia", vietnamese: "nỗi nhớ nhà / hoài niệm", level: "C1", ipa: "/nɒˈstældʒə/", example: "A wave of nostalgia washed over me." },
  { english: "obsolete", vietnamese: "lỗi thời", level: "C1", ipa: "/ˈɒbsəliːt/", example: "This technology is now obsolete." },
  { english: "pragmatic", vietnamese: "thực tế", level: "C1", ipa: "/præɡˈmætɪk/", example: "We need a pragmatic approach to the problem." },
  { english: "quandary", vietnamese: "tình thế khó xử", level: "C1", ipa: "/ˈkwɒndəri/", example: "I am in a quandary about what to do." },
  { english: "resilient", vietnamese: "kiên cường", level: "C1", ipa: "/rɪˈzɪliənt/", example: "Children are incredibly resilient." },
  { english: "scrutinize", vietnamese: "xem xét kỹ lưỡng", level: "C1", ipa: "/ˈskruːtənaɪz/", example: "They rigorously scrutinize all facts." },
  { english: "tangible", vietnamese: "hữu hình", level: "C1", ipa: "/ˈtændʒəbl/", example: "We need tangible evidence." },
  { english: "ubiquitous", vietnamese: "có mặt khắp nơi", level: "C1", ipa: "/juːˈbɪkwɪtəs/", example: "Mobile phones are ubiquitous." },
  { english: "versatile", vietnamese: "đa năng", level: "C1", ipa: "/ˈvɜːsətaɪl/", example: "He is a highly versatile actor." },
  { english: "whimsical", vietnamese: "kỳ lạ / ngẫu hứng", level: "C1", ipa: "/ˈwɪmzɪkl/", example: "The story has a whimsical charm." },
  { english: "zealous", vietnamese: "nhiệt huyết", level: "C1", ipa: "/ˈzeləs/", example: "He is a zealous supporter of the team." },
  { english: "alleviate", vietnamese: "làm giảm bớt", level: "C1", ipa: "/əˈliːvieɪt/", example: "Medicine will alleviate the pain." },
  { english: "bolster", vietnamese: "củng cố", level: "C1", ipa: "/ˈbəʊlstər/", example: "We need to bolster the economy." },
  { english: "candor", vietnamese: "sự thành thật", level: "C1", ipa: "/ˈkændər/", example: "I appreciate your candor." },
  { english: "delineate", vietnamese: "phác họa / mô tả", level: "C1", ipa: "/dɪˈlɪnieɪt/", example: "The law delineates our rights." },
  { english: "empathy", vietnamese: "sự đồng cảm", level: "C1", ipa: "/ˈempəθi/", example: "She showed great empathy for the victims." },
  { english: "frivolous", vietnamese: "phù phiếm", level: "C1", ipa: "/ˈfrɪvələs/", example: "Don't spend money on frivolous things." },
  { english: "gregarious", vietnamese: "hòa đồng", level: "C1", ipa: "/ɡrɪˈɡeəriəs/", example: "A gregarious personality is useful in sales." },
  { english: "hinder", vietnamese: "cản trở", level: "C1", ipa: "/ˈhɪndər/", example: "The bad weather hindered our progress." },
  { english: "illicit", vietnamese: "bất hợp pháp", level: "C1", ipa: "/ɪˈlɪsɪt/", example: "He was arrested for illicit drug trade." },
  { english: "jeopardize", vietnamese: "gây nguy hiểm", level: "C1", ipa: "/ˈdʒepədaɪz/", example: "This mistake could jeopardize your career." },
  { english: "kinship", vietnamese: "mối quan hệ họ hàng / thân thiết", level: "C1", ipa: "/ˈkɪnʃɪp/", example: "I feel a strong kinship with him." },
  { english: "lethargic", vietnamese: "uể oải", level: "C1", ipa: "/ləˈθɑːdʒɪk/", example: "The heat makes me feel lethargic." },
  { english: "mundane", vietnamese: "nhàm chán / trần tục", level: "C1", ipa: "/mʌnˈdeɪn/", example: "I hate doing mundane chores." },
  { english: "novelty", vietnamese: "sự mới lạ", level: "C1", ipa: "/ˈnɒvlti/", example: "The novelty of the idea attracted investors." },
  { english: "opaque", vietnamese: "mờ đục / khó hiểu", level: "C1", ipa: "/əʊˈpeɪk/", example: "The windows are made of opaque glass." },
  { english: "prolific", vietnamese: "hiệu suất cao", level: "C1", ipa: "/prəˈlɪfɪk/", example: "He is a prolific writer." },
  { english: "quintessential", vietnamese: "tinh túy", level: "C1", ipa: "/ˌkwɪntɪˈsenʃl/", example: "She is the quintessential Californian girl." }
];

async function main() {
  console.log("Cleaning up fake words from database...");
  await prisma.word.deleteMany({
    where: {
      english: {
        contains: 'vocabulary_word'
      }
    }
  });

  // Write the true words to data/words.json just to keep a backup
  const dataPath = path.join(__dirname, '../data/words.json');
  fs.writeFileSync(dataPath, JSON.stringify(wordsDB, null, 2));
  console.log("Updated data/words.json with true english words.");

  console.log(`Seeding ${wordsDB.length} true words into db...`);
  
  for (const w of wordsDB) {
    await prisma.word.upsert({
      where: { english: w.english },
      update: {
        vietnamese: w.vietnamese,
        level: w.level,
        ipa: w.ipa,
        example: w.example
      },
      create: {
        english: w.english,
        vietnamese: w.vietnamese,
        level: w.level,
        ipa: w.ipa,
        example: w.example
      }
    });
  }

  console.log("Database seeded successfully with true vocabulary words!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
