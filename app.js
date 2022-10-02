const express = require('express')
const AWS = require('aws-sdk')
const url = require('url'); 

const app = express()
const port = 3000

app.use(express.urlencoded());
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const REGION ='ap-southeast-1';
const ACCESS_KEY ='AKIA6EVSUW7MT7GZ2GOP';
const SECRET_KEY ='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';
const TABLE_NAME = "SinhVien"

AWS.config.update({
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
    region: REGION
})

const client = new AWS.DynamoDB.DocumentClient()

app.get('/', (req, res) => {
    const {ma_sv, ten_sv, tuoi, sdt, email, success, fail} = req.query

    const params = {
        TableName: TABLE_NAME
    }
    client.scan(params, (err, data) => {
        if(err){
            console.log(err)
            res.send("Có lỗi xảy ra!")
            return
        }
        res.render("index.ejs", {
            data: data.Items, 
            err: {
                ma_sv: ma_sv,
                ten_sv: ten_sv,
                tuoi: tuoi,
                sdt: sdt,
                email: email
            }, 
            success: success,
            fail: fail
        })
    })
})

app.post('/them-sinh-vien', async (req, res) => {
    let {ma_sv, ten_sv, tuoi, sdt, email} = req.body

    ma_sv = ma_sv.trim()
    ten_sv = ten_sv.trim()
    tuoi = tuoi.trim()
    sdt = sdt.trim()
    email = email.trim()

    let err = {}
    if(/^\d{8}$/.test(ma_sv) == false){
        err["ma_sv"] = "Mã sinh viên phải là số và có 8 ký tự!"
    }

    if(ten_sv.length == 0){
        err["ten_sv"] = "Tên sinh viên không được để trống!"
    }

    if(/^\d+$/.test(tuoi) == false){
        err["tuoi"] = "Tuổi phải là số dương và không được trống"
    }

    if(/^\d{10,}$/.test(sdt) == false){
        err["sdt"] = "Số điện thoại phải lớn hơn hoặc bằng 10 ký tự"
    }

    if(/^.+@.+$/.test(email) == false){
        err["email"] = "Email không hợp lệ"
    }

    if(Object.keys(err).length != 0){
        res.redirect(url.format({
            pathname:"/",
            query: err
        }))
        return
    }

    let rs = await client.get({
        TableName: TABLE_NAME,
        Key: {
            ma_sv: ma_sv
        } 
    }).promise()
    if(rs.Item){
        res.redirect(url.format({
            pathname:"/",
            query: {"ma_sv": "Mã sinh viên đã tồn tại!"}
        }))
        return
    }

    const params = {
        TableName: TABLE_NAME,
        Item: {
            ma_sv: ma_sv,
            ten_sv: ten_sv,
            tuoi: tuoi,
            sdt: sdt,
            email: email
        }
    }
    client.put(params, (err, data) => {
        if(err){
            console.log(err)
            res.redirect(url.format({
                pathname:"/",
                query: {"fail": "Có lỗi xảy ra, không thể thêm sinh viên!"}
            }))
            return
        }
        res.redirect(url.format({
            pathname:"/",
            query: {"success": "Thêm sinh viên thành công!"}
        }))
    })
})

app.get('/xoa-sinh-vien', async (req, res) => {

    let rs = await client.get({
        TableName: TABLE_NAME,
        Key: {
            ma_sv: req.query.ma_sv
        } 
    }).promise()
    if(!rs.Item){
        res.redirect(url.format({
            pathname:"/",
            query: {"fail": "Mã sinh viên không tồn tại!"}
        }))
        return
    }   

    const params = {
        TableName: TABLE_NAME,
        Key: {
            ma_sv: req.query.ma_sv
        }
    }
    client.delete(params, (err, data) => {
        if(err){
            console.log(err)
            res.redirect(url.format({
                pathname:"/",
                query: {"fail": "Có lỗi xảy ra, không thể xóa sinh viên!"}
            }))
            return
        }
        res.redirect(url.format({
            pathname:"/",
            query: {"success": "Xóa sinh viên thành công!"}
        }))
    })
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})