const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const app = express()
const port = 5000
app.use(express.json())
const staticFolderPath = path.join(__dirname, 'static')

app.get('/', (req, res) => {
    let checkData = ''
    const filePath = path.join(staticFolderPath, file)

    while (checkData !== '0|-1') {
        axios
            .get('https://www.firefox.fun/yhapi.ashx?act=getPhone&token=63e825cd6b0512c1eb5b85a0bbcb3b24_18800&iid=1008&did=vnm-1008-99991')
            .then((response) => {
                const data = response.split('|')
                console.log('dataPort', dataPort)

                const port = data[data.length - 2]
                const phone = data[data.length - 1]
                const id = data[1]

                console.log('port: ', port)
                console.log('phone: ', phone)
                console.log('id: ', id)

                axios.get(`http://www.firefox.fun/yhapi.ashx?act=addBlack&token=b7c94daad5e3dd71ffca9298976ec0d4_3&pkey=${id}&reason=used`)

                let phoneArray = []
                for (let i = 0; i < 11; i++) {
                    let newPhone = phone + i.toString()
                    phoneArray.push(newPhone.toString())
                    fs.writeFileSync(filePath, phoneArray.join(','), 'utf8')
                }
            })
            .catch((error) => {
                console.error(error)
            })
    }
})

app.get('/getListPhone', (req, res) => {
    const phoneList = []

    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/)
        if (match) {
            const port = match[1]
            const filePath = path.join(staticFolderPath, file)
            const data = fs.readFileSync(filePath, 'utf8')

            let status = 1

            if (data.startsWith('disable_')) {
                status = 0
            }

            const numbers = data.replace(/^disable_/, '').split(',')

            numbers.forEach((number) => {
                if (number !== '') {
                    phoneList.push({ port, num: number, status })
                }
            })
        }
    })

    res.json(phoneList)
})

app.get('/getPhone', (req, res) => {
    let minPort = Infinity
    let minPortFileName = ''
    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/)
        if (match) {
            const port = parseInt(match[1], 10)
            const filePath = path.join(staticFolderPath, file)

            const data = fs.readFileSync(filePath, 'utf8')

            // if (!data.trim() || data.trim() === 'disable_') {
            //     console.log('here')
            //     fs.unlinkSync(filePath) // Delete the file
            //     return
            // }

            if (!data.startsWith('disable')) {
                if (port < minPort) {
                    minPort = port
                    minPortFileName = file
                }
            }
        }
    })

    if (minPort === Infinity) {
        res.status(404).send('Không có port')
        return
    }

    const filePath = path.join(staticFolderPath, minPortFileName)
    const data = fs.readFileSync(filePath, 'utf8')
    const listPhones = data.split(',')

    if (listPhones.length === 0) {
        res.status(404).send(`Không có phone ở port ${minPort}`)
        return
    }

    const firstPhone = listPhones.shift()
    fs.writeFileSync(filePath, 'disable_' + listPhones.join(','), 'utf8')

    // Ghi đè hoặc tạo mới file
    const newFilePath = path.join(staticFolderPath, 'new_phone.txt')
    const newPhoneData = `${minPort}_${firstPhone}\n`
    fs.writeFileSync(newFilePath, newPhoneData, { flag: 'w' }) // 'w' để ghi đè file nếu nó đã tồn tại

    res.send(firstPhone)
})

app.get('/active/:port', (req, res) => {
    const port = req.params.port
    const fileName = `list_phone_${port}.txt`
    const filePath = path.join(staticFolderPath, fileName)

    if (fs.existsSync(filePath)) {
        let data = fs.readFileSync(filePath, 'utf8')

        // Check if the file is empty or contains only "disable_"
        if (!data.trim() || data.trim() === 'disable_') {
            res.status(400).send(`Không có port tương ứng với ${port}`)
            return
        }

        if (data.startsWith('disable_')) {
            data = data.substring('disable_'.length)
            fs.writeFileSync(filePath, data, 'utf8')
            res.send(`Port ${port} đã được bật`)
        } else {
            console.log(`Port ${port} is already enabled`)
            res.status(400).send(`Port ${port} đã được bật`)
        }
    } else {
        console.log(`Port ${port} does not exist`)
        res.status(400).send(`Port ${port} không tồn tại`)
    }
})

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname)
    },
})

const upload = multer({ storage: storage })
app.post('/upload', upload.single('file'), (req, res) => {
    console.log('dô hog', req.file)
    // Kiểm tra xem có file được tải lên không
    if (!req.file) {
        return res.status(400).send('Không có file được tải lên.')
    }
    const filePath = req.file.path
    // Thành công, trả về thông báo
    res.send(`File đã được tải lên thành công tại|->http://localhost:3000/${filePath}.`)
})

// Route để nhận đường dẫn và gọi API upload
app.post('/uploadFromPath', (req, res) => {
    console.log(req.body)
    const filePath = req.body.filePath

    // Kiểm tra xem có đường dẫn được gửi lên không
    if (!filePath) {
        return res.status(400).json({ error: 'Thiếu đường dẫn file.' })
    }

    // Tạo đường dẫn tuyệt đối từ đường dẫn gửi lên
    const absolutePath = path.resolve(filePath)

    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ error: 'File không tồn tại.' })
    }

    // Gọi API upload
    const uploadApiUrl = 'http://localhost:3000/upload' // Thay đổi thành URL thực tế của API upload
    const formData = new FormData()
    formData.append('file', fs.createReadStream(absolutePath))
    // const formDataHeaders = formData.getHeaders();
    // console.log(formDataHeaders);
    // Create a readable stream for the file
    const fileStream = fs.createReadStream(absolutePath)
    let fileBuffer = Buffer.from([])
    fileStream.on('data', (chunk) => {
        fileBuffer = Buffer.concat([fileBuffer, chunk])
    })

    fileStream.on('end', () => {
        // Convert the buffer to a base64-encoded string
        const fileBase64 = fileBuffer.toString('base64')

        // Build the form data string
        const formDataString = `--myboundary\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(
            absolutePath,
        )}"\r\nContent-Type: application/octet-stream\r\n\r\n${fileBase64}\r\n--myboundary--`

        // Make the Axios request
        axios
            .post(uploadApiUrl, formDataString, {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=myboundary`,
                },
            })
            .then((response) => {
                fs.unlinkSync(absolutePath)
                res.json({ message: response.data })
            })
            .catch((error) => {
                console.log('ERROR: ' + error)
                res.status(500).json({ error: 'Lỗi khi gọi API upload.' })
            })
    })
})

app.listen(5000, () => {
    console.log('Server is running on port 5000')
})
