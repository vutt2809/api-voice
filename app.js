const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const axios = require('axios')
const cors = require('cors')
const app = express()
const port = 5000
let counter = 0

app.use(express.json())
app.use('/uploads', express.static('uploads'))
app.use(cors())
const FormData = require('form-data')
const urlServer = 'http://trum99.ddns.net:5000'
const staticFolderPath = path.join(__dirname, 'static')
const countFilePath = path.join(staticFolderPath, 'count.txt')
// const currentFilePath = path.join(staticFolderPath, 'current_phone.txt')
const newPhonetFilePath = path.join(staticFolderPath, 'new_phone.txt')

app.get('/getAPI', async (req, res) => {
    counter = 0
    let listAllPhones = []
    while (true) {
        const response = await axios.get('http://www.worldcode.win/yhapi.ashx?act=getPhone&token=d0ba68cd9a3cce002431d60f1dcb8df0_347&iid=1000&country=vnm')
        const responseData = response.data
        if (responseData) {
            if (responseData.trim() === '0|-1') {
                res.json(1)
                break
            }
            const data = responseData.split('|')

            const port = data[data.length - 2].replace('COM', '')
            const phone = data[data.length - 1]
            const id = data[1]

            axios.get(`http://www.worldcode.win/yhapi.ashx?act=addBlack&token=d0ba68cd9a3cce002431d60f1dcb8df0_347&pkey=${id}&reason=used`)

            const filePath = path.join(staticFolderPath, `list_phone_${port}.txt`)
            const filePortPath = path.join(staticFolderPath, `status_${port}.txt`)
            fs.writeFileSync(filePortPath, '0,0')

            let phoneArray = []
            phoneArray.push(phone.toString())
            for (let i = 0; i < 11; i++) {
                let newPhone = phone + `${i}`
                phoneArray.push(newPhone.toString())
                listAllPhones.push(`${port}-${newPhone.toString()}`)
                fs.writeFileSync(filePath, phoneArray.join(','), 'utf8')
            }
        }
    }
})

// Láy phone đã active
app.get('/get-list-phone-active', (req, res) => {
    const phoneList = []
    // Xoá dữ liệu cũ
    // fs.writeFileSync(currentFilePath, '', 'utf8')
    // fs.writeFileSync(countFilePath, '0', 'utf8')
    fs.writeFileSync(newPhonetFilePath, '', 'utf8')
    const zeroFile = path.join(staticFolderPath, 'list_phone_0.txt')

    if (fs.existsSync(zeroFile)) {
        try {
            fs.unlinkSync(zeroFile)
            console.log('File deleted successfully.')
        } catch (error) {
            console.error('Error deleting file:', error)
        }
    } else {
        console.log('File does not exist.')
    }

    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/)
        if (match) {
            const port = match[1]
            const filePath = path.join(staticFolderPath, file)
            const data = fs.readFileSync(filePath, 'utf8')
            if (!data.startsWith('disable_')) {
                const numbers = data.replace(/^disable_/, '').split(',')
                const firstPhone = numbers.shift()

                // Kiểm tra trạng thái của port
                const portStatusFilePath = path.join(staticFolderPath, `status_${port}.txt`)
                const portStatusData = fs.readFileSync(portStatusFilePath, 'utf-8')
                const portValue = portStatusData.split(',')

                phoneList.push({ port, num: firstPhone, success: portValue[0], failed: portValue[1] })
                fs.writeFileSync(filePath, 'disable_' + numbers.join(','), 'utf8')
            }

            if (data.length === 0 || data.trim() === 'disable_') {
                fs.unlinkSync(filePath)
            }
        }
    })

    res.json(phoneList)
})

// Reset về đàu
app.get('/reset', (req, res) => {
    const files = fs.readdirSync(staticFolderPath)
    counter = 0
    files.forEach((file) => {
        const filePath = path.join(staticFolderPath, file)
        fs.writeFileSync(filePath, '', 'utf8')
        console.log(`Cleared content of file: ${file}`)

        // xử lý riêng
        fs.writeFileSync(currentFilePath, '[]', 'utf8')
        fs.writeFileSync(countFilePath, '0', 'utf8')

        const match = file.match(/^list_phone_(\d+)\.txt$/)
        const matchStatus = file.match(/^status_(\d+)\.txt$/)
        if (match || matchStatus) {
            const filePa = path.join(staticFolderPath, file)
            fs.unlinkSync(filePa)
            console.log(`Deleted file: ${file}`)
        }
    })

    res.send('reset phone thành công')
})

// lấy 1 phone
app.get('/get-phone', (req, res) => {
    let minPort = Infinity
    let minPortFileName = ''
    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/)
        if (match) {
            const port = parseInt(match[1], 10)
            const filePath = path.join(staticFolderPath, file)

            const data = fs.readFileSync(filePath, 'utf8')

            if (!data.startsWith('disable')) {
                if (port < minPort) {
                    minPort = port
                    minPortFileName = file
                }
            }
        }
    })

    if (minPort === Infinity) {
        res.status(404).json({
            result: -1,
            message: 'Không có port',
        })
        return
    }

    const filePath = path.join(staticFolderPath, minPortFileName)
    const data = fs.readFileSync(filePath, 'utf8')
    const listPhones = data.split(',')

    if (listPhones.length === 0) {
        res.status(404).send({
            result: -2,
            mesage: `Không có phone ở port ${minPort}`,
        })
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

// lấy danh sách các phon hiện tại
app.get('/get-list-current-phone', (req, res) => {
    const phoneList = []
    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/)
        if (match) {
            const port = match[1]
            const filePath = path.join(staticFolderPath, file)
            const data = fs.readFileSync(filePath, 'utf8')
            if (!data.startsWith('disable_')) {
                const numbers = data.replace(/^disable_/, '').split(',')
                const firstPhone = numbers[0]

                // Kiểm tra trạng thái của port
                const portStatusFilePath = path.join(staticFolderPath, `status_${port}.txt`)
                const portStatusData = fs.readFileSync(portStatusFilePath, 'utf-8')
                const portValue = portStatusData.split(',')

                phoneList.push({ port, num: firstPhone, success: portValue[0], failed: portValue[1] })
                // fs.writeFileSync(filePath, 'disable_' + numbers.join(','), 'utf8')
            }

            if (data.length === 0 || data.trim() === 'disable_') {
                fs.unlinkSync(filePath)
            }
        }
    })
    res.json(phoneList)
})

// active port lên
app.get('/active/:port/:status', (req, res) => {
    try {
        const port = req.params.port
        const status = req.params.status

        const fileName = `list_phone_${port}.txt`
        const filePath = path.join(staticFolderPath, fileName)

        if (fs.existsSync(filePath)) {
            let data = fs.readFileSync(filePath, 'utf8')

            if (!data.trim() || data.trim() === 'disable_') {
                res.status(400).send(`Không có port tương ứng với ${port}`)
                return
            }

            if (data.startsWith('disable_')) {
                data = data.substring('disable_'.length)
                fs.writeFileSync(filePath, data, 'utf8')

                // Ghi vào trạng thái của port
                const filePortName = `status_${port}.txt`
                const filePortPath = path.join(staticFolderPath, filePortName)
                const portValue = fs.readFileSync(filePortPath, 'utf8')

                let countValue = portValue.split(',')
                let countSucess = parseInt(countValue[0])
                let countFail = parseInt(countValue[1])

                if (fs.existsSync(filePath) && status) {
                    if (status === 'success') {
                        countSucess += 1
                    } else if (status === 'fail') {
                        countFail += 1
                    }
                }
                fs.writeFileSync(filePortPath, `${countSucess},${countFail}`, 'utf8', { flag: 'w' })
                //

                res.send(`Port ${port} đã được bật`)
            } else {
                res.status(400).send(`Port ${port} đã được bật, hãy lấy phone trước khi bật lại`)
            }
        } else {
            res.status(400).send(`Port ${port} không tồn tại`)
        }
    } catch (error) {
        console.log('active error', error.message)
        return null
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
    //const filePath = req.file.path
    // Giải mã dữ liệu base64 thành dữ liệu nhị phân
    const base64Data = fs.readFileSync(req.file.path)
    // const file = new File(
    //     [Uint8Array.from(atob(base64Str), (m) => m.codePointAt(0))],
    //     'myfilename.jpeg',
    //     { type: "image/jpeg" }
    //  );
    const binaryData = Buffer.from(base64Data, 'base64').toString('binary')
    //const bufferData = Buffer.from(base64Data, 'base64');
    // Tạo tên tệp và lưu vào thư mục uploads
    const fileName = Date.now() + '-' + req.file.originalname
    const filePath1 = path.join('uploads', fileName)
    console.log(binaryData)
    fs.writeFile(filePath1, binaryData, { encoding: 'base64' }, function (err) {
        console.log('File created', binaryData)
    })

    // Lưu dữ liệu nhị phân vào tệp
    //fs.writeFileSync(req.file.path, binaryData);

    // Thành công, trả về thông báo
    res.send(`File đã được tải lên thành công tại|->${urlServer}/${filePath1}`)
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
                console.error(`File '${fileName}' không tồn tại.`)
                return // Bỏ qua file không tồn tại và tiếp tục với file khác
            }
            // Gọi API upload
            const uploadApiUrl = `${urlServer}/upload` // Thay đổi thành URL thực tế của API upload
            const formData = new FormData()
            formData.append('file', fs.createReadStream(absolutePath))
            // const formDataHeaders = formData.getHeaders();
            // console.log(formDataHeaders);
            // Create a readable stream for the file
            try {
                fs.readFileSync(absolutePath)
            } catch (error) {
                return
            }
            const fileStream = fs.createReadStream(absolutePath)
            let fileBuffer = Buffer.from([])
            fileStream.on('data', (chunk) => {
                fileBuffer = Buffer.concat([fileBuffer, chunk])
            })

            fileStream.on('end', () => {
                try {
                    fs.readFileSync(absolutePath)
                } catch (error) {
                    return
                }
                // Convert the buffer to a base64-encoded string
                const fileBase64 = fileBuffer.toString('base64')
                console.log('truyền lên', fileBuffer, fileBase64)
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

            pathFileVoice = result.url.replace(urlServer, '.')
            absolutePathVoice = path.resolve(pathFileVoice)
            // const fileStream = fs.createReadStream(absolutePathVoice)
            // let fileBuffer = Buffer.from([])
            // fileStream.on('data', (chunk) => {
            //     fileBuffer = Buffer.concat([fileBuffer, chunk])
            // })

            // fileStream.on('end', () => {
            //     try {
            //         fs.readFileSync(absolutePathVoice);
            //     } catch (error) {
            //         return ;
            //     }
            //     // Convert the buffer to a base64-encoded string
            //     const fileBase64 = fileBuffer.toString('base64')
            //     console.log("truyền lên",fileBuffer,fileBase64);
            //     // Build the form data string
            //      // Tạo chuỗi formDataString
            // const formDataString = `--myboundary\r\nContent-Disposition: form-data; name="file"; filename="${path.basename(absolutePathVoice)}"\r\nContent-Type: application/octet-stream\r\n\r\n${fileBase64}\r\n--myboundary\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n--myboundary\r\nContent-Disposition: form-data; name="response_format"\r\n\r\ntext\r\n--myboundary--`;

            //     // Make the Axios request
            //     axios
            //     .post("https://api.openai.com/v1/audio/transcriptions", formDataString, {
            //         headers: {
            //             'Content-Type': `multipart/form-data; boundary=myboundary`,
            //             'Authorization':'Bearer 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'
            //         },
            //     })
            //     .then((response) => {console.log("res->",response); })
            //     .catch ((error) => { console.log("error->",error.response);})
            // })
            const formData = new FormData()
            formData.append('file', fs.createReadStream(absolutePathVoice), {
                filename: path.basename(absolutePathVoice),
                contentType: 'audio/wav', // Replace with the actual MIME type of your file
            })
            formData.append('model', 'whisper-1')
            formData.append('response_format', 'text')
            axios
                .post('https://api.openai.com/v1/audio/transcriptions', formData, {
                    headers: {
                        //...formData.getHeaders(),
                        Authorization: 'Bearer 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',
                    },
                })
                .then((response) => {
                    console.log('res->', response.data)
                    result.text = response.data
                    res.json(result)
                })
                .catch((error) => {
                    console.log('error->', error.response.data)
                    res.json(result)
                })
        }
    }

    // Kiểm tra xem port có tồn tại trong file log không

    // } else {
    //   // Nếu không tồn tại, trả về thông báo lỗi
    //   res.status(404).json({ error: 'Không tìm thấy số điện thoại cho port này.' });
    // }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})
