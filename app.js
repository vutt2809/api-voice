const express = require('express')
const app = express()
const port = 3000
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { isSet } = require('util/types');


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
    const port = req.query.port;
    console.log('port: ', port);
    const staticFolderPath = path.join(__dirname, 'static');
    const fileName = `list_phone_${port}.txt`;
    const filePath = path.join(staticFolderPath, fileName);

    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        console.log(data);

        let listPhones = data.split(',');
        const firstPhone = listPhones.shift();

        fs.writeFileSync(filePath, listPhones.join(','), 'utf8');

        res.send(firstPhone);
    } else {
        console.log('File not found');
        res.status(404).send('File Not Found');
    }
});
    

app.get('/getCode', (req, res) => {

})

app.get('/resetPort', (req, res) => {
  
})

app.listen(port, () => {
  console.log(`App listening on port 2 ${port}`)
})