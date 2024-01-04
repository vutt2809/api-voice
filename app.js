const express = require('express')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const app = express()
const port = 3000

app.use(express.json()); 
app.get('/', (req, res) => {
  axios.get('https://www.firefox.fun/yhapi.ashx?act=getPhone&token=63e825cd6b0512c1eb5b85a0bbcb3b24_18800&iid=1008&did=vnm-1008-99991')
  .then(response => {
    const data = response.split('|');
    console.log('dataPort', dataPort);

    const port = data[data.length - 2];
    const phone = data[data.length - 1];

    console.log('port: ', port);
    console.log('phone: ', phone);

    let phoneArray = [];
    for (let i = 0; i < 11; i++) {
      let newPhone = phone + i;
      phoneArray.push(newPhone.toString());
    }
  })
  .catch(error => {
    console.error(error);
  });
})

app.get('/getPhone', (req, res) => {

})

app.get('/getCode', (req, res) => {
  
})

app.get('/resetPort', (req, res) => {
  
})

app.get('/resetPort', (req, res) => {
  
})
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });
app.post('/upload', upload.single('file'), (req, res) => {
  console.log("dô hog", req.file);
  // Kiểm tra xem có file được tải lên không
  if (!req.file) {
    return res.status(400).send('Không có file được tải lên.');
  }

  // Thành công, trả về thông báo
  res.send('File đã được tải lên thành công.');
});

// Route để nhận đường dẫn và gọi API upload
app.post('/uploadFromPath', (req, res) => {
  console.log(req.body);
  const filePath = req.body.filePath;

  // Kiểm tra xem có đường dẫn được gửi lên không
  if (!filePath) {
    return res.status(400).json({ error: 'Thiếu đường dẫn file.' });
  }

  // Tạo đường dẫn tuyệt đối từ đường dẫn gửi lên
  const absolutePath = path.resolve(filePath);

  // Kiểm tra xem file có tồn tại không
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'File không tồn tại.' });
  }

  // Gọi API upload
  const uploadApiUrl = 'http://localhost:3000/upload'; // Thay đổi thành URL thực tế của API upload
  const formData = new FormData();
  formData.append('file', fs.createReadStream(absolutePath));
  // const formDataHeaders = formData.getHeaders();
  // console.log(formDataHeaders);
  console.log(formData);
  axios.post(uploadApiUrl, formData, {
    headers: {
      'Content-Type': `multipart/form-data`,
    },
  })
  .then(response => {
    // Trả về thông báo thành công từ API upload
    res.json({ message: response.data });
  })
    .catch(error => {
    console.log("ERROR: " + error);
    // Trả về lỗi nếu có lỗi trong quá trình gọi API upload
    res.status(500).json({ error: 'Lỗi khi gọi API upload.' });
  });
});

app.listen(port, () => {
  console.log(`App listening on port 2 ${port}`)
})