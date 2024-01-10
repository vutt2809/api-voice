const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const { fail } = require('assert')
const app = express()
const port = 5000
let counter = 0
app.use(express.json())
const urlLocal = 'http://localhost:5000'
const urlServer = 'http://trum99.ddns.net:5000'
const staticFolderPath = path.join(__dirname, 'static')
const countFilePath = path.join(staticFolderPath, 'count.txt')
const currentFilePath = path.join(staticFolderPath, 'current_phone.txt')
const newPhonetFilePath = path.join(staticFolderPath, 'new_phone.txt')

app.get('/', (req, res) => {
    let checkData = ''

    while (checkData.trim() !== '0|-1') {
        axios
            .get('https://www.firefox.fun/yhapi.ashx?act=getPhone&token=63e825cd6b0512c1eb5b85a0bbcb3b24_18800&iid=1008&did=vnm-1008-99991')
            .then((response) => {
                checkData = response.data
                const data = response.data.split('|')
                console.log('dataPort', dataPort)

                const port = data[data.length - 2]
                const phone = data[data.length - 1]
                const id = data[1]

                console.log('port: ', port)
                console.log('phone: ', phone)
                console.log('id: ', id)

                axios.get(`http://www.firefox.fun/yhapi.ashx?act=addBlack&token=b7c94daad5e3dd71ffca9298976ec0d4_3&pkey=${id}&reason=used`)

                const filePath = path.join(staticFolderPath, `list_phone${port}.txt`)
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

app.get('/get-list-phone-active', (req, res) => {
    const phoneList = []

    // Xoá dữ liệu cũ
    fs.writeFileSync(currentFilePath, '', 'utf8')
    fs.writeFileSync(countFilePath, '0', 'utf8')
    fs.writeFileSync(newPhonetFilePath, '', 'utf8')

    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/)
        if (match) {
            const port = match[1]
            const filePath = path.join(staticFolderPath, file)
            const data = fs.readFileSync(filePath, 'utf8')
            if (!data.startsWith('disable_')) {
                const numbers = data.replace(/^disable_/, '').split(',')
                const firstPhone = numbers.shift()
                phoneList.push({ port, num: firstPhone, status: 1 })
                fs.writeFileSync(filePath, 'disable_' + numbers.join(','), 'utf8')
            }
        }
    })

    const jsonString = JSON.stringify(phoneList, null, 2)
    fs.writeFileSync(currentFilePath, jsonString, 'utf8')
    res.json(phoneList)
})

app.get('/reset', (req, res) => {
    const files = fs.readdirSync(staticFolderPath)

    files.forEach((file) => {
        const filePath = path.join(staticFolderPath, file)
        fs.writeFileSync(filePath, '', 'utf8')
        console.log(`Cleared content of file: ${file}`)
    })

    res.send('reset phone thành công')
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
    const newPhoneData = `${minPort}-${firstPhone}\n`
    fs.writeFileSync(newFilePath, newPhoneData, { flag: 'a' })

    // Ghi đè hoặc tạo mới file count.txt
    const countFilePath = path.join(staticFolderPath, 'count.txt')
    counter += 1
    console.log(counter)

    fs.writeFileSync(countFilePath, counter.toString(), 'utf8', { flag: 'w' })

    res.send(`${minPort}-${firstPhone}`)
})

app.get('/get-phone', (req, res) => {
    const data = fs.readFileSync(currentFilePath, 'utf8')
    const listPhone = JSON.parse(data)
    console.log('list current phone: ', listPhone)

    const newPhone = listPhone.shift()
    console.log('listphone: ', listPhone)
    fs.writeFileSync(currentFilePath, JSON.stringify(listPhone, null, 2), 'utf8', { flag: 'w' })

    const newPhoneData = `${newPhone.port}-${newPhone.num}\n`
    fs.writeFileSync(newPhonetFilePath, newPhoneData, { flag: 'a' })

    counter += 1
    console.log(counter)

    fs.writeFileSync(countFilePath, counter.toString(), 'utf8', { flag: 'w' })
    res.send(`${newPhone.port}-${newPhone.num}`)
})

app.get('/get-list-current-phone', (req, res) => {
    const data = fs.readFileSync(currentFilePath, 'utf8')
    const listPhone = data ? JSON.parse(data) : []
    res.json(listPhone)
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
    res.send(`File đã được tải lên thành công tại|->${urlServer}/${filePath}.`)
})

// Route để nhận đường dẫn và gọi API upload
app.post('/uploadFromPath', (req, res) => {
    console.log(req.body)
    const folderPath = req.body.folderPath

    // Kiểm tra xem có đường dẫn thư mục được gửi lên không
    if (!folderPath) {
        return res.status(400).json({ error: 'Thiếu đường dẫn thư mục.' })
    }

    // Tạo đường dẫn tuyệt đối từ đường dẫn thư mục gửi lên
    const absoluteFolderPath = path.resolve(folderPath)

    // Kiểm tra xem thư mục có tồn tại không
    if (!fs.existsSync(absoluteFolderPath)) {
        return res.status(404).json({ error: 'Thư mục không tồn tại.' })
    }

    // Đọc danh sách các file trong thư mục
    fs.readdir(absoluteFolderPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Lỗi khi đọc danh sách file trong thư mục.' })
        }
        const uploadedFileNames = []
        // Lặp qua từng file và thực hiện quy trình upload
        files.forEach((fileName) => {
            const absolutePath = path.join(absoluteFolderPath, fileName)
            if (!fs.existsSync(absolutePath)) {
                console.error(`File '${fileName}' không tồn tại.`);
                return;  // Bỏ qua file không tồn tại và tiếp tục với file khác
            }
            // Gọi API upload
            const uploadApiUrl = `${urlServer}/upload` // Thay đổi thành URL thực tế của API upload
            const formData = new FormData()
            formData.append('file', fs.createReadStream(absolutePath))
            // const formDataHeaders = formData.getHeaders();
            // console.log(formDataHeaders);
            // Create a readable stream for the file
            try {
                fs.readFileSync(absolutePath);
            } catch (error) {
                return ;
            }
            const fileStream = fs.createReadStream(absolutePath)
            let fileBuffer = Buffer.from([])
            fileStream.on('data', (chunk) => {
                fileBuffer = Buffer.concat([fileBuffer, chunk])
            })

            fileStream.on('end', () => {
                try {
                    fs.readFileSync(absolutePath);
                } catch (error) {
                    return ;
                }
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
                        console.log(`File '${fileName}' đã được tải lên thành công.`)
                        const match = fileName.match(/COM(\d+)/)
                        // Kiểm tra xem có kết quả khớp không và lấy số từ kết quả
                        const port = match ? match[1] : null
                        const url = `${response.data.split('|->')[1]}`
                        axios
                            .get(`${urlServer}/getPhoneNumber/${port}`)
                            .then((response) => {
                                axios
                                    .get(`${urlServer}/writeLogUploadedFiles?msg=${JSON.stringify({ port: port, phone: response.data.phoneNumber, url: url })}`)
                                    .then((response) => {})
                                    .catch((error) => {})
                            })
                            .catch((error) => {
                                console.log('gọi đi ->')
                                axios
                                    .get(
                                        `${urlServer}/writeFile?msg=${encodeURI(
                                            `Có lỗi khi lấy voice không tồn tại num tại port: ${port}[${new Date()}]\n`,
                                        )}&path=${encodeURI(`./static/log_error_getvoice.txt`)}`,
                                    )
                                    .then((response) => {})
                                    .catch((error) => {})
                            })
                        fs.unlinkSync(absolutePath) // Xóa file sau khi upload thành công

                        //fs.unlinkSync(filePath); // Xóa file sau khi upload thành công
                    })

                    .catch((error) => {
                        console.error(`Lỗi khi tải lên file '${fileName}':`, error.message)
                    })
            })
        })
    })
    console.log()
    // Kiểm tra xem file log đã tồn tại chưa

    res.json({ message: 'Quá trình upload hoàn thành.' })
})

app.get('/writeLogUploadedFiles', (req, res) => {
    const data = req.query.msg
    const logFilePath = path.resolve('./static/uploaded_files.txt')
    if (!fs.existsSync(logFilePath)) {
        // Nếu chưa tồn tại, tạo mới và ghi vào
        fs.writeFileSync(logFilePath, data + '@#&')
    } else {
        // Nếu đã tồn tại, ghi thêm vào
        fs.appendFileSync(logFilePath, data + '@#&')
    }
})
const writeLogFile = (path1, data) => {
    const logFilePath = path.resolve(path1)
    if (!fs.existsSync(logFilePath)) {
        // Nếu chưa tồn tại, tạo mới và ghi vào
        fs.writeFileSync(logFilePath, data)
    } else {
        // Nếu đã tồn tại, ghi thêm vào
        fs.appendFileSync(logFilePath, data)
    }
}
app.get('/writeFile', (req, res) => {
    const data = req.query.msg
    const path = req.query.path
    console.log(data, path)
    writeLogFile(path, data)
})
const readLogFile = (logFilePath) => {
    try {
        const data = fs.readFileSync(logFilePath, 'utf8')

        return data
    } catch (error) {
        console.error('Error reading log file:', error.message)
        return 'no_data'
    }
}
app.get('/getPhoneNumber/:port', (req, res) => {
    const port = req.params.port
    const fileLog = path.resolve('./static/new_phone.txt')
    // Đọc nội dung của file log
    const phoneNumbers = {}
    const phoneNumbersData = readLogFile(fileLog)
    const listData = phoneNumbersData.split(',')
    listData.forEach((line) => {
        const [port, phoneNumber] = line.split('-')
        if (port && phoneNumber) {
            phoneNumbers[port.trim()] = phoneNumber.trim()
        }
    })

    // Kiểm tra xem port có tồn tại trong file log không
    if (phoneNumbers[port]) {
        // Nếu tồn tại, trả về số điện thoại
        res.json({ phoneNumber: phoneNumbers[port] })
    } else {
        // Nếu không tồn tại, trả về thông báo lỗi
        res.status(404).json({ error: 'Không tìm thấy số điện thoại cho port này.' })
    }
})

app.get('/getInfoStatics', (req, res) => {
    let fileLog = path.resolve('./static/count.txt')
    const countPhone = parseInt(readLogFile(fileLog))
    fileLog = path.resolve('./static/uploaded_files.txt')
    const countSucess = readLogFile(fileLog).split('@#&').length
    res.json({
        total: countPhone,
        success: countSucess,
        failed: countPhone - countSucess,
    })
})

app.get('/getvoice/:port/:num', (req, res) => {
    const port = req.params.port
    const num = req.params.num
    console.log(req)
    const fileLog = path.resolve('./static/uploaded_files.txt')
    // Đọc nội dung của file log
    const phoneNumbers = {}
    const phoneNumbersData = readLogFile(fileLog)
    const listData = phoneNumbersData.split('@#&')
    console.log(listData, port, num)
    let result = []
    if (port == 0 && num == 0) {
        result = listData.map((i) => (i.trim() !== '' ? JSON.parse(i) : null))
    } else {
        const tmp = listData.filter((i) => {
            const item = i.trim() !== '' ? JSON.parse(i) : { port: -1, phone: -1 }
            console.log(item.port, port, item.phone, num)
            if (item.port == port && item.phone == num) {
                //item.url = item.url.replaceAll("\\", "/");
                return item
            }
        })
        console.log(tmp)
        if (tmp.length > 0) {
            //tmp[0].url=tmp[0].url.replaceAll("\\","/")
            result = tmp[0]
            result = { ...JSON.parse(result) }
            result.url = result.url.replaceAll('\\', '/')
        }
    }

    // Kiểm tra xem port có tồn tại trong file log không

    res.json(result)
    // } else {
    //   // Nếu không tồn tại, trả về thông báo lỗi
    //   res.status(404).json({ error: 'Không tìm thấy số điện thoại cho port này.' });
    // }
})

app.listen(5000, () => {
    console.log('Server is running on port 5000')
})
