const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();


app.get('/getListPhone', (req, res) => {
    const staticFolderPath = path.join(__dirname, 'static');
    const phoneList = [];

    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/);
        if (match) {
            const port = match[1];
            const filePath = path.join(staticFolderPath, file);
            const data = fs.readFileSync(filePath, 'utf8');
            
            let status = 1; // Default status is 1 (enabled)

            // Check if the file starts with "disable_"
            if (data.startsWith('disable_')) {
                status = 0; // If "disable_", set status to 0 (disabled)
            }

            const numbers = data.replace(/^disable_/, '').split(',');

            numbers.forEach((number) => {
                if (number !== '') {
                    phoneList.push({ port, num: number, status });
                }
            });
        }
    });

    res.json(phoneList);
});


app.get('/getPhone', (req, res) => {
    const staticFolderPath = path.join(__dirname, 'static');
    
    let minPort = Infinity;
    let minPortFileName = '';
    fs.readdirSync(staticFolderPath).forEach((file) => {
        const match = file.match(/^list_phone_(\d+)\.txt$/);
        if (match) {
            const port = parseInt(match[1], 10);
            const filePath = path.join(staticFolderPath, file);
            
            const data = fs.readFileSync(filePath, 'utf8');

            // if (!data.trim() || data.trim() === 'disable_') {
            //     fs.unlinkSync(filePath); // Delete the file
            //     return;
            // }

            if (!data.startsWith('disable')) {
                if (port < minPort) {
                    minPort = port;
                    minPortFileName = file;
                }
            }
        }
    });

    if (minPort === Infinity) {
        res.status(404).send('Không có port');
        return;
    }

    const filePath = path.join(staticFolderPath, minPortFileName);
    const data = fs.readFileSync(filePath, 'utf8');
    const listPhones = data.split(',');

    if (listPhones.length === 0) {
        res.status(404).send(`Không có phone ở port ${minPort}`);
        return;
    }

    const firstPhone = listPhones.shift();
    fs.writeFileSync(filePath, 'disable_' + listPhones.join(','), 'utf8');

    res.send(firstPhone);
});

app.get('/active/:port', (req, res) => {
    const port = req.params.port;
    const staticFolderPath = path.join(__dirname, 'static');
    const fileName = `list_phone_${port}.txt`;
    const filePath = path.join(staticFolderPath, fileName);

    if (fs.existsSync(filePath)) {
        let data = fs.readFileSync(filePath, 'utf8');
        
        // Check if the file is empty or contains only "disable_"
        if (!data.trim() || data.trim() === 'disable_') {
            res.status(400).send(`Không có port tương ứng với ${port}`);
            return;
        }

        if (data.startsWith('disable_')) {
            data = data.substring('disable_'.length);
            fs.writeFileSync(filePath, data, 'utf8');
            res.send(`Port ${port} đã được bật`);
        } else {
            console.log(`Port ${port} is already enabled`);
            res.status(400).send(`Port ${port} đã được bật`);
        }
    } else {
        console.log(`Port ${port} does not exist`);
        res.status(400).send(`Port ${port} không tồn tại`);
    }
});



app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
