var db = require('./../helpers/db_helpers')
var helper = require('./../helpers/helpers')
var multiparty = require('multiparty')
var fs = require('fs');
var imageSavePath = "./public/img/"
var image_base_url = helper.ImagePath();

const msg_success = "successfully";
const msg_fail = "fail";

module.exports.controller = (app, io, socket_list) => {

    const msg_invalidUser = "invalid username and password";

    const msg_category_added = "Category added Successfully.";
    const msg_category_update = "Category updated Successfully.";
    const msg_category_delete = "Category deleted Successfully.";

    const msg_product_added = "Product added Successfully.";
    const msg_product_update = "Product updated Successfully.";
    const msg_product_delete = "Product deleted Successfully.";

  

    app.post('/api/admin/login', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        helper.CheckParameterValid(res, reqObj, ["email", "password", "dervice_token"], () => {

            var authToken = helper.createRequestToken();
            db.query("UPDATE `user_detail` SET `auth_token` = ?, `dervice_token` = ?, `modify_date` = NOW() WHERE `user_type` = ? AND `email` = ? AND `password` = ? AND `status` = ? ", [authToken, reqObj.dervice_token, "2", reqObj.email, reqObj.password, "1"], (err, result) => {

                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                if (result.affectedRows > 0) {

                    db.query('SELECT `user_id`, `username`, `name`, `email`, `mobile`, `mobile_code`, `auth_token`, `created_date` FROM `user_detail` WHERE `email` = ? AND `password` = ? AND `status` = "1" ', [reqObj.email, reqObj.password], (err, result) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res);
                            return
                        }

                        if (result.length > 0) {
                            res.json({
                                'status': '1',
                                'payload': result[0],
                                'message': msg_success
                            })
                        } else {
                            res.json({
                                'status': '0',
                                'message': msg_invalidUser
                            })
                        }


                    })

                } else {
                    res.json({
                        'status': '0',
                        'message': msg_invalidUser
                    })
                }
            })
        })
    })


    // ----------------------------------------- --Category_add  ----------------------------------------------------------------
    app.post("/api/admin/product_category_add", (req, res) => {
        //aman
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (uObj) => {
            helper.CheckParameterValid(res, reqObj, ["cat_name", "color"], () => {
                db.query("INSERT INTO `category_detail`( `cat_name`, `image`, `color`, `created_date`, `modify_date`) VALUES  (?,?,?, NOW(), NOW())", [
                    reqObj.cat_name, reqObj.image, reqObj.color
                ], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return;
                    }

                    if (result) {
                        res.json({
                            "status": "1", "payload": {
                                "cat_id": result.insertId,
                                "cat_name": reqObj.cat_name[0],
                                "color": reqObj.color[0],
                                "image": '',
                            }, "message": msg_category_added
                        });
                    } else {
                        res.json({ "status": "0", "message": msg_fail })
                    }
                })
            })
        })
    })
    // ----------------------------------------------------product_category_update-----------------------------------------------------

    app.post("/api/admin/product_category_update", (req, res) => {
        var reqObj = req.body;
        var condition = '';
        checkAccessToken(req.headers, res, (uObj) => {
            helper.CheckParameterValid(res, reqObj, ["cat_id", "cat_name", "color"], () => {
                db.query("UPDATE `category_detail` SET `cat_name`=?," + condition + " `color`=?,`modify_date`=NOW() WHERE `cat_id`= ? AND `status` = ?", [
                    reqObj.cat_name, reqObj.color, reqObj.cat_id, "1"
                ], (err, result) => {

                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return;
                    }

                    if (result) {
                        res.json({
                            "status": "1", "payload": {
                                "cat_id": parseInt(reqObj.cat_id[0]),
                                "cat_name": reqObj.cat_name[0],
                                "color": reqObj.color[0],
                                "image": '',
                            }, "message": msg_category_update
                        });
                    } else {
                        res.json({ "status": "0", "message": msg_fail })
                    }

                })
            })
        })

    })
    // ----------------------------------------------------------------delete_category---------------------------------------------------
    app.post('/api/admin/product_category_delete', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;

        helper.CheckParameterValid(res, reqObj, ["cat_id"], () => {

            checkAccessToken(req.headers, res, (uObj) => {
                db.query("UPDATE `category_detail` SET `status`= ?, `modify_date` = NOW() WHERE `cat_id`= ? ", [
                    "2", reqObj.cat_id,
                ], (err, result) => {

                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return;
                    }

                    if (result.affectedRows > 0) {
                        res.json({
                            "status": "1", "message": msg_category_delete
                        });
                    } else {
                        res.json({ "status": "0", "message": msg_fail })
                    }

                })
            }, "2")
        })
    })
    // ---------------------------------------------------
    app.post('/api/admin/product_category_list', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;

        checkAccessToken(req.headers, res, (uObj) => {
            db.query("SELECT `cat_id`, `cat_name`, `image` , `color` FROM `category_detail` WHERE `status`= ? ", [
                "1"
            ], (err, result) => {

                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return;
                }

                res.json({
                    "status": "1", "payload": result
                });
            })
        }, "2")
    })

    //////////////////////////////////////////============Product list===========//////////////////////////////////////////////////////////////////

    app.post("/api/admin/product_add", (req, res) => {
        checkAccessToken(req.headers, res, (uObj) => {
            var reqObj = req.body;
            helper.Dlog("---------- Parameter ----")
            helper.Dlog(reqObj)
            helper.CheckParameterValid(res, reqObj, ["name", "detail", "cat_id", "brand_id", "type_id", "unit_name", "unit_value", "nutrition_weight", "price",], () => {
                db.query("INSERT INTO `product_detail`(`cat_id`, `brand_id`, `type_id`, `name`, `detail`, `unit_name`, `unit_value`, `nutrition_weight`, `price`, `created_date`, `modify_date`) VALUES (?,?,?, ?,?,?, ?,?,?, NOW(), NOW() ) ", [reqObj.cat_id, reqObj.brand_id, reqObj.type_id, reqObj.name, reqObj.detail, reqObj.unit_name, reqObj.unit_value, reqObj.nutrition_weight, reqObj.price], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }
                    if (result) {

                        res.json({
                            "status": "1", "message": msg_product_added
                        });

                    } else {
                        res.json({ "status": "0", "message": msg_fail })
                    }
                })
            })

        })
    })

    app.post('/api/admin/product_update', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;

        helper.CheckParameterValid(res, reqObj, ["prod_id", "name", "detail", "cat_id", "brand_id", "type_id", "unit_name", "unit_value", "nutrition_weight", "price"], () => {

            checkAccessToken(req.headers, res, (uObj) => {

                db.query("UPDATE `product_detail` SET `cat_id`=?,`brand_id`=?,`type_id`=?,`name`=?,`detail`=?,`unit_name`=?,`unit_value`=?,`nutrition_weight`=?,`price`=?, `modify_date`=NOW() WHERE  `prod_id`= ? AND `status` = ? ", [
                    reqObj.cat_id, reqObj.brand_id, reqObj.type_id, reqObj.name, reqObj.detail, reqObj.unit_name, reqObj.unit_value, reqObj.nutrition_weight, reqObj.price, reqObj.prod_id, "1"
                ], (err, result) => {

                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return;
                    }

                    if (result.affectedRows > 0) {
                        res.json({
                            "status": "1", "message": msg_product_update
                        });
                    } else {
                        res.json({ "status": "0", "message": msg_fail })
                    }

                })
            }, "2")
        })
    })

    app.delete('/api/admin/product_delete/:id', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (uObj) => {
            // db.query("UPDATE `category_detail` SET `status`= ?, `modify_date` = NOW() WHERE `cat_id`= ? ", [
            //     "2", reqObj.cat_id,
            // ], (err, result) => {'DELETE FROM tax WHERE tax_id=?', [ reqObj.prod_id]
            db.query('DELETE FROM product_detail WHERE prod_id=?', [req.params.id], (err, result) => {

                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return;
                }

                if (result.affectedRows > 0) {
                    res.json({
                        "status": "1", "message": msg_product_delete
                    });
                } else {
                    res.json({ "status": "0", "message": msg_fail })
                }

            })
        }, "2")
    })
    app.post('/api/admin/product_list', (req, res) => {
        checkAccessToken(req.headers, res, (uObj) => {
            db.query("SELECT * FROM  product_detail   ORDER BY prod_id DESC ", [
                "1"
            ], (err, result) => {

                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return;
                }

                res.json({
                    "status": "1", "payload": result
                });
            })
        }, "2")

    })


    // ========================================================contact book ===============================///////////////////////////////////////


    app.get('/api/contactbook_list', (req, res) => {
        db.query('SELECT * FROM contact_book ORDER BY contact_id DESC ', (err, result) => {
            if (err) throw err;
            res.end(JSON.stringify(result));
        })
    })

    app.post('/api/add_contactbook', (req, res) => {
        var users = {
            "user_id": req.body.user_id,
            "contact_name": req.body.contact_name,
            "contact_number": req.body.contact_number,
            "contact_email": req.body.contact_email,
            "contact_status": req.body.contact_status,
        }
        db.query('SELECT * FROM contact_book WHERE contact_number = ?', [req.body.contact_number], function (error, results, fields) {
            if (results.length > 0) {
                res.json({
                    status: false,
                    message: 'This Contact Already Saved'
                })
            }
            else {
                db.query('INSERT INTO contact_book SET ?', users, function (error, results, fields) {
                    if (error) {
                        res.json({
                            status: false,
                            message: error
                        })
                    } else {
                        var id = results.insertId;
                        db.query('SELECT * FROM contact_book WHERE contact_id = ?', [id], function (error, results, fields) {
                            res.json({
                                status: true,
                                data: results,
                                message: 'Contact  Create  Successfully'
                            })
                        })
                    }
                })
            }
        })
    })

    app.put('/api/update_contact_list', (req, res) => {
        let contact_id = req.body.contact_id
        var data = {
            "user_id": req.body.user_id,
            "contact_name": req.body.contact_name,
            "contact_number": req.body.contact_number,
            "contact_email": req.body.contact_email,
            "contact_status": req.body.contact_status,
        }

        db.query('UPDATE contact_book SET ? WHERE contact_id = ?', [data, contact_id], function (error, results, fields) {
            if (error) {
                res.json({
                    status: false,
                    message: 'there are some error with query'
                })
            } else {
                var id = contact_id;
                db.query('SELECT * FROM contact_book WHERE contact_id = ?', [id], function (error, results, fields) {
                    res.json({
                        status: true,
                        data: results,
                        message: 'Conatct   Update  Successfully'
                    })
                })
            }

        })

    })

    app.delete('/api/delete_contact/:id', (req, res) => {
        db.query('DELETE FROM contact_book WHERE contact_id=?', [req.params.id], (err, rows, fields) => {
            if (!err) {
                res.json({
                    status: true,
                    message: 'Contact deleted Successfully'
                })
            } else {
                console.log(err)
            }
        });
    })

    ///////////////////////////////==================================tax===========================/////////////////////////////////////////

    app.get('/api/tax_list', (req, res) => {
        db.query('SELECT * FROM  tax  ORDER BY tax_id DESC ', (err, result) => {
            if (err) throw err;
            res.end(JSON.stringify(result));
        })
    })

    app.post('/api/add_tax', (req, res) => {
        var users = {
            "user_id": req.body.user_id,
            "total_tax": req.body.total_tax,
        }
        db.query('INSERT INTO tax SET ?', users, function (error, results, fields) {

            if (error) {
                res.json({
                    status: false,
                    message: error
                })
            } else {
                res.json({
                    status: true,
                    data: results,
                    message: 'tax Saved Successfully'
                })

            }
        })
    })

    app.put('/api/update_tax', (req, res) => {
        let tax_id = req.body.tax_id
        var data = {
            "user_id": req.body.user_id,
            "total_tax": req.body.total_tax,
        }

        db.query('UPDATE tax SET ? WHERE tax_id  = ?', [data, tax_id], function (error, results, fields) {

            if (error) {
                res.json({
                    status: false,
                    message: 'there are some error with query'
                })
            } else {
                var id = tax_id;
                db.query('SELECT * FROM tax WHERE tax_id  = ?', [id], function (error, results, fields) {
                    res.json({
                        status: true,
                        data: results,
                        message: 'Tax  Update  Successfully'
                    })
                })
            }
        })
    })

    app.delete('/api/delete_tax/:id', (req, res) => {
        db.query('DELETE FROM tax WHERE tax_id=?', [req.params.id], (err) => {
            if (!err) {
                res.json({
                    status: true,
                    message: 'Tax Deleted Successfully'
                })
            } else {
            }
        });
    });

    ///////////////////////////---=================================khatabook=============================================////////////////

    app.get('/api/khatabook_list', (req, res) => {
        db.query('SELECT * FROM khatabook', (err, result) => {
            if (err) throw err;
            console.log(result)
            res.end(JSON.stringify(result));
        })
    })
    app.post('/api/add_khatabook', (req, res) => {

        console.log(req.body)
        var users = {
            "user_id": req.body.user_id,
            "customer_name": req.body.customer_name,
            "customer_number": req.body.customer_number,
            "amount": req.body.amount,
            "amount_status": req.body.amount_status,
            "total_amount": req.body.total_amount,
        }

        db.query('INSERT INTO  khatabook SET ?', users, function (error, results, fields) {
            if (error) {
                res.json({
                    status: false,
                    message: error + 'there are some error with query'
                })
            } else {
                var khatanum = results.insertId;
                console.log(khatanum + 'id')

                db.query('SELECT * FROM khatabook WHERE khatanum = ?', [khatanum], function (error, results, fields) {
                    res.json({
                        status: true,
                        data: results,
                        // fields: fields,
                        message: 'Khata book information  insert Successfully'
                    })
                })
            }
        })
    })

    app.post('/api/addamount_khatabook', (req, res) => {
        var users = {
            "khatanum": req.body.khatanum,
            "amount": req.body.amount,
            "amount_status": req.body.amount_status,
            "total_amount": req.body.total_amount,
            "amount_date": new Date(),
            "description": req.body.description,
        }
        db.query('INSERT INTO  khata_hisab SET ?', users, function (error, results, fields) {
            if (error) {
                res.json({
                    status: false,
                    message: error + 'there are some error with query'
                })
            } else {
                var khata_id = results.insertId;
                console.log(khata_id + 'id')

                db.query('SELECT * FROM khata_hisab WHERE khata_id = ?', [khata_id], function (error, results, fields) {
                    res.json({
                        status: true,
                        data: results,
                        // fields: fields,
                        message: 'Khata book Amount information  insert Successfully'
                    })
                })
            }
        })
    })

    app.get('/api/khataamount_list/:khatanum', (req, res) => {
        db.query('SELECT * FROM khata_hisab WHERE khatanum=?', [req.params.khatanum], (err, results) => {
            if (!err) {
                res.send(results);
            } else {
                console.log(err)
            }
        });
    })

    app.delete('/api/delete_khatahisab/:id', (req, res) => {
        db.query('DELETE FROM khata_hisab WHERE khatanum=?', [req.params.id], (err) => {
            if (!err) {
                res.json({
                    status: true,
                    message: 'Khata Clear Successfully'

                })
            } else {
                console.log(err)
            }
        });
    })
    app.delete('/api/delete_khatahisabCustomer/:id', (req, res) => {
        db.query('DELETE FROM khatabook WHERE khatanum=?', [req.params.id], (err) => {
            if (!err) {
                console.log('deleted')
                res.json({
                    status: true,
                    message: ' Khata deleted Successfully'

                })
            } else {
                console.log(err)
            }
        });
    })


    //////////////////////////////////////////////===========Counter bill page apis====================//////////////////////////////////


   app.get('/api/bill_list', (req, res) => {
        db.query('SELECT * FROM  book_bill ORDER BY bill_id DESC  ', (err, result) => {
            if (err) throw err;
            res.end(JSON.stringify(result));
        })
    })
    
    app.get('/api/lasttoken', (req, res) => {
        db.query('SELECT   token_no FROM  book_bill ORDER BY bill_id DESC LIMIT 1  ', (err, result) => {
            if (err) throw err;
            res.end(JSON.stringify(result));
        })
    })
    app.get('api/getbill_byTableid/:id', (req, res) => {
        db.query('SELECT * FROM book_bill WHERE  table_id=?', [req.params.id], (err, results) => {
            if (err) throw err;
            res.end(JSON.stringify(results));
        });
    })
    
    app.get('api/getbill_byBill/:id', (req, res) => {
        db.query('SELECT * FROM book_bill WHERE  bill_id=?', [req.params.id], (err, results) => {
            if (err) throw err;
            res.end(JSON.stringify(results));
        });
    })
    
    app.get('api/today_bill_list/:id', (req, res) => {
        db.query('SELECT * FROM  book_bill  and  create_date ='+GETDATE()+' ORDER BY bill_id DESC  ', (err, result) => {
            if (err) throw err;
            res.end(JSON.stringify(result));
        })
    })
    app.post('/api/addbill_data', (req, res) => {
        var responseJson = JSON.stringify(req.body);
        var users = {
            "user_id": req.body.user_id,
            "bill_no": req.body.bill_no,
            "bill_order": responseJson,
            "table_id": req.body.table_id,
            "table_name": req.body.table_name,
            "total_bill": req.body.total_bill,
            "bill_status": req.body.bill_status,
            "cutomer_name": req.body.cutomer_name,
            "cutomer_number": req.body.cutomer_number,
            "create_date": req.body.create_date,
            "cutomer_address":req.body.cutomer_address,
            "delivery_charge":req.body.delivery_charge,
            "discount":req.body.discount,
            "status":req.body.status,
            "attender_id":req.body.attender_id,
            "attender_name":req.body.attender_name,
            "token_no":req.body.token_no,
            "payment_type":req.body.payment_type,
            "subtotal_bill":req.body.subtotal_bill,
            "gst_amt":req.body.gst_amt,
        }
        var users1 = {
            "user_id": req.body.user_id,
            "contact_name": req.body.cutomer_name,
            "contact_number": req.body.cutomer_number,
            "contact_email": '',
            "contact_status": 1,
        }
        
        db.query('INSERT INTO  book_bill SET ?', users, function (error, results1, fields) {
            if (error) {
                res.json({
                    status: false,
                    message: error + 'there are some error with query'
                })
            } 
            else {
                db.query('SELECT * FROM contact_book WHERE contact_number = ?', [ req.body.cutomer_number], function (error12, results2, fields) {
                    if (results2.length=== 0) {
                        if(users1.contact_name.length !== 0 && users1.contact_number.length !==0){
                        db.query('INSERT INTO contact_book SET ?', users1, function (error11, results, fields) { 
                        })
                    }
                    } 
              })   
                res.json({
                    status: true,
                    data: results1,
                    message: 'Bill Save  Successfully'
                })
            }
    });
    })
    app.put('/api/update_bill_info', (req, res) => {
        var responseJson = JSON.stringify(req.body);
        let bill_id = req.body.bill_id
        var users = {
            "user_id": req.body.user_id,
            "bill_no": req.body.bill_no,
            "bill_order": responseJson,
            "table_id": req.body.table_id,
            "table_name": req.body.table_name,
            "total_bill": req.body.total_bill,
            "bill_status": req.body.bill_status,
            "cutomer_name": req.body.cutomer_name,
            "cutomer_number": req.body.cutomer_number,
            "create_date": req.body.create_date,
            "delivery_charge":req.body.delivery_charge,
            "discount":req.body.discount,
            "status":req.body.status,
            "attender_id":req.body.attender_id,
            "attender_name":req.body.attender_name,
            "token_no":req.body.token_no,
            "payment_type":req.body.payment_type,
            "subtotal_bill":req.body.subtotal_bill,
            "gst_amt":req.body.gst_amt,
    
        }
    
        db.query('UPDATE  book_bill SET ? WHERE bill_id = ?', [users, bill_id], function (error, results, fields) {
    
            if (error) {
                res.json({
                    status: false,
                    message: 'there are some error with query'
                })
            } else {
    
                db.query('SELECT * FROM  book_bill WHERE bill_id = ?', [bill_id], function (error, results, fields) {
                    res.json({
                        status: true,
                        data: results,
                        message: 'Bill  Update  Successfully'
                    })
                })
            }
        })
    })
    
    app.put('/api/complete_order', (req, res) => {
        let bill_no = req.body.bill_no
        var data = {
            "bill_status": req.body.bill_status,
            "table_name": req.body.table_name, 
            "table_id": req.body.table_id,
        }
        db.query('UPDATE  book_bill SET ? WHERE bill_no = ?', [data, bill_no], function (error, results, fields) {
    
            if (error) {
                res.json({
                    status: false,
                    message: 'there are some error with query'
                })
            } else {
    
                    res.json({
                        status: true,
                        data: results,
                        message: 'Compete Order  Update  Successfully'
                    })
            }
        })
    })
    
    app.delete('/api/delete_bill/:id', (req, res) => {
        db.query('DELETE FROM book_bill WHERE bill_id=?', [req.params.id], function (error, results, fields) {
            if (!error) {
                res.json({
                    status: true,
                    message: 'Bill Deleted Successfully'
    
                })
            } else {
                console.log(error)
            }
        });
    })
    
    //-----------------------------------------------------Dashborad-------------------------------------------------------------------------
    
    app.get('/api/getallcount', (req, res) => {
        var userid=1
        db.query('SELECT count(*) as total  FROM  book_bill  where user_id = ' + userid + '', (err, result1) => {
            db.query('SELECT count(*) as total  FROM contact_book	 where user_id = ' + userid + '', (err, result2) => {
                db.query('SELECT count(*) as total  FROM restro_table  where user_id = ' + userid + '', (err, result3) => {
                            if (err) throw err;
                            var results = [];
                            results.push({
                                'billCount': result1[0].total,
                                'customercount': result2[0].total,
                            });
                            res.json({
                                status: true,
                                data: results,
                                message: 'Total'
                            });
                        });
              
            });
        });
    });

    // ======================================================================================================================================


    app.post('/api/admin/new_orders_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            db.query("SELECT `od`.`order_id`,`od`.`user_id`, `od`.`cart_id`, `od`.`total_price`, `od`.`user_pay_price`, `od`.`discount_price`, `od`.`deliver_price`, `od`.`deliver_type`, `od`.`payment_type`, `od`.`payment_status`, `od`.`order_status`, `od`.`status`, `od`.`created_date`, GROUP_CONCAT(DISTINCT `pd`.`name` SEPARATOR ',') AS `names`, GROUP_CONCAT(DISTINCT (CASE WHEN `imd`.`image` != '' THEN  CONCAT( '" + image_base_url + "' ,'', `imd`.`image` ) ELSE '' END) SEPARATOR ',') AS `images`, `ad`.`name` as `user_name`, `ad`.`phone`, `ad`.`address`, `ad`.`city`, `ad`.`state`, `ad`.`postal_code` FROM `order_detail` AS `od` " +
                "INNER JOIN `cart_detail` AS `cd` ON FIND_IN_SET(`cd`.`cart_id`, `od`.`cart_id`) > 0  " +
                "INNER JOIN `product_detail` AS `pd` ON  `cd`.`prod_id` = `pd`.`prod_id` " +
                "INNER JOIN `image_detail` AS `imd` ON  `imd`.`prod_id` = `pd`.`prod_id` " +
                "INNER JOIN `address_detail` AS `ad` ON  `od`.`address_id` = `ad`.`address_id` " +
                "WHERE (`od`.`payment_type` = 1 OR ( `od`.`payment_type` = 2 AND `od`.`payment_status` = 2 ) ) AND `order_status` <= 2 GROUP BY `od`.`order_id` ORDER BY `od`.`order_id` ", [], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }

                    res.json({
                        "status": "1",
                        "payload": result,
                        "message": msg_success
                    })
                })
        }, '2')
    })

    app.post('/api/admin/completed_orders_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            db.query("SELECT `od`.`order_id`, `od`.`user_id`, `od`.`cart_id`, `od`.`total_price`, `od`.`user_pay_price`, `od`.`discount_price`, `od`.`deliver_price`, `od`.`deliver_type`, `od`.`payment_type`, `od`.`payment_status`, `od`.`order_status`, `od`.`status`, `od`.`created_date`, GROUP_CONCAT(DISTINCT `pd`.`name` SEPARATOR ',') AS `names`, GROUP_CONCAT(DISTINCT (CASE WHEN `imd`.`image` != '' THEN  CONCAT( '" + image_base_url + "' ,'', `imd`.`image` ) ELSE '' END) SEPARATOR ',') AS `images`, `ad`.`name` as `user_name`, `ad`.`phone`, `ad`.`address`, `ad`.`city`, `ad`.`state`, `ad`.`postal_code`  FROM `order_detail` AS `od` " +
                "INNER JOIN `cart_detail` AS `cd` ON FIND_IN_SET(`cd`.`cart_id`, `od`.`cart_id`) > 0  " +
                "INNER JOIN `product_detail` AS `pd` ON  `cd`.`prod_id` = `pd`.`prod_id` " +
                "INNER JOIN `image_detail` AS `imd` ON  `imd`.`prod_id` = `pd`.`prod_id` " +
                "INNER JOIN `address_detail` AS `ad` ON  `od`.`address_id` = `ad`.`address_id` " +
                "WHERE (`od`.`payment_type` = 1 OR ( `od`.`payment_type` = 2 AND `od`.`payment_status` = 2 ) ) AND `order_status` = 3 GROUP BY `od`.`order_id` ORDER BY `od`.`order_id` ", [], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }

                    res.json({
                        "status": "1",
                        "payload": result,
                        "message": msg_success
                    })
                })
        }, '2')
    })

    app.post('/api/admin/cancel_decline_orders_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            db.query("SELECT `od`.`order_id`, `od`.`user_id`, `od`.`cart_id`, `od`.`total_price`, `od`.`user_pay_price`, `od`.`discount_price`, `od`.`deliver_price`, `od`.`deliver_type`, `od`.`payment_type`, `od`.`payment_status`, `od`.`order_status`, `od`.`status`, `od`.`created_date`, GROUP_CONCAT(DISTINCT `pd`.`name` SEPARATOR ',') AS `names`, GROUP_CONCAT(DISTINCT (CASE WHEN `imd`.`image` != '' THEN  CONCAT( '" + image_base_url + "' ,'', `imd`.`image` ) ELSE '' END) SEPARATOR ',') AS `images`, `ad`.`name` as `user_name`, `ad`.`phone`, `ad`.`address`, `ad`.`city`, `ad`.`state`, `ad`.`postal_code`  FROM `order_detail` AS `od` " +
                "INNER JOIN `cart_detail` AS `cd` ON FIND_IN_SET(`cd`.`cart_id`, `od`.`cart_id`) > 0  " +
                "INNER JOIN `product_detail` AS `pd` ON  `cd`.`prod_id` = `pd`.`prod_id` " +
                "INNER JOIN `image_detail` AS `imd` ON  `imd`.`prod_id` = `pd`.`prod_id` " +
                "INNER JOIN `address_detail` AS `ad` ON  `od`.`address_id` = `ad`.`address_id` " +
                "WHERE (`od`.`payment_type` = 1 OR ( `od`.`payment_type` = 2 AND `od`.`payment_status` = 2 ) ) AND `order_status` > 3  GROUP BY `od`.`order_id` ORDER BY `od`.`order_id` ", [], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }

                    res.json({
                        "status": "1",
                        "payload": result,
                        "message": msg_success
                    })
                })
        }, '2')
    })

    app.post('/api/admin/order_detail', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["order_id", "user_id"], () => {


                db.query("SELECT `od`.`order_id`, `od`.`cart_id`, `od`.`total_price`, `od`.`user_pay_price`, `od`.`discount_price`, `od`.`deliver_price`, `od`.`deliver_type`, `od`.`payment_type`, `od`.`payment_status`, `od`.`order_status`, `od`.`status`, `od`.`created_date` FROM `order_detail` AS `od` " +

                    "WHERE `od`.`order_id` = ? AND `od`.`user_id` = ? ;" +

                    "SELECT `uod`.`order_id`, `ucd`.`cart_id`, `ucd`.`user_id`, `ucd`.`prod_id`, `ucd`.`qty`, `pd`.`cat_id`, `pd`.`brand_id`, `pd`.`type_id`, `pd`.`name`, `pd`.`detail`, `pd`.`unit_name`, `pd`.`unit_value`, `pd`.`nutrition_weight`, `pd`.`price`, `pd`.`created_date`, `pd`.`modify_date`, `cd`.`cat_name`, IFNULL( `bd`.`brand_name`, '' ) AS `brand_name` , `td`.`type_name`, IFNULL(`od`.`price`, `pd`.`price` ) as `offer_price`, IFNULL(`od`.`start_date`,'') as `start_date`, IFNULL(`od`.`end_date`,'') as `end_date`, (CASE WHEN `od`.`offer_id` IS NOT NULL THEN 1 ELSE 0 END) AS `is_offer_active`, (CASE WHEN `imd`.`image` != '' THEN  CONCAT( '" + image_base_url + "' ,'', `imd`.`image` ) ELSE '' END) AS `image`, (CASE WHEN `od`.`price` IS NULL THEN `pd`.`price` ELSE `od`.`price` END) as `item_price`, ( (CASE WHEN `od`.`price` IS NULL THEN `pd`.`price` ELSE `od`.`price` END) * `ucd`.`qty`)  AS `total_price`, IFNULL( `rd`.`rate`, 0) AS `rating`, IFNULL( `rd`.`message`, '') AS `review_message` FROM `order_detail` AS `uod` " +
                    "INNER JOIN `cart_detail` AS `ucd` ON FIND_IN_SET(`ucd`.`cart_id`, `uod`.`cart_id`) > 0  " +
                    "INNER JOIN `product_detail` AS `pd` ON `pd`.`prod_id` = `ucd`.`prod_id` " +
                    "INNER JOIN `category_detail` AS `cd` ON `pd`.`cat_id` = `cd`.`cat_id` " +

                    "LEFT JOIN `brand_detail` AS `bd` ON `pd`.`brand_id` = `bd`.`brand_id` " +
                    "LEFT JOIN `offer_detail` AS `od` ON `pd`.`prod_id` = `od`.`prod_id` AND `od`.`status` = 1 AND `od`.`start_date` <= NOW() AND `od`.`end_date` >= NOW() " +
                    "LEFT JOIN `review_detail` AS `rd` ON `uod`.`order_id` = `rd`.`order_id` " +
                    "INNER JOIN `image_detail` AS `imd` ON `pd`.`prod_id` = `imd`.`prod_id` AND `imd`.`status` = 1 " +
                    "INNER JOIN `type_detail` AS `td` ON `pd`.`type_id` = `td`.`type_id` " +
                    "WHERE `uod`.`order_id` = ? AND `uod`.`user_id` = ? GROUP BY `ucd`.`cart_id`, `pd`.`prod_id`", [reqObj.order_id, reqObj.user_id, reqObj.order_id, reqObj.user_id], (err, result) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res)
                            return
                        }

                        if (result[0].length > 0) {

                            result[0][0].cart_list = result[1]

                            res.json({
                                "status": "1",
                                "payload": result[0][0],
                                "message": msg_success
                            })
                        } else {
                            res.json({
                                'status': '0',
                                'message': 'invalid order'
                            })
                        }
                    })
            })
        }, '2')
    })

    app.post('/api/admin/order_status_change', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["order_id", "user_id", "order_status"], () => {
                db.query("UPDATE `order_detail` SET `order_status`= ?,`modify_date`= NOW() WHERE `order_id` = ? AND `user_id` = ? AND `order_status` < ? ", [reqObj.order_status, reqObj.order_id, reqObj.user_id, reqObj.order_status], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }

                    if (result.affectedRows > 0) {

                        var title = ""
                        var message = ""
                        var notiType = 2
                        //1: new, 2: order_accept, 3: order_delivered, 4: cancel, 5: order declined	
                        switch (reqObj.order_status) {
                            case "2":
                                title = "Order Accepted"
                                message = "your order #" + reqObj.order_id + " accepted."
                                break;
                            case "3":
                                title = "Order Delivered"
                                message = "your order #" + reqObj.order_id + " delivered."
                                break;
                            case "4":
                                title = "Order Cancel"
                                message = "your order #" + reqObj.order_id + " canceled."
                                break;
                            case "5":
                                title = "Order Declined"
                                message = "your order #" + reqObj.order_id + " declined."
                                break;
                            default:
                                break;
                        }

                        db.query("INSERT INTO `notification_detail`( `ref_id`, `user_id`, `title`, `message`, `notification_type`) VALUES (?,?,?, ?,?)", [reqObj.order_id, reqObj.user_id, title, message, notiType], (err, iResult) => {
                            if (err) {
                                helper.ThrowHtmlError(err);
                                return
                            }

                            if (iResult) {
                                helper.Dlog("Notification Added Done")
                            } else {
                                helper.Dlog("Notification Fail")
                            }
                        })

                        res.json({
                            "status": "1",
                            "message": "Order Status updated successfully"
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })
            })
        }, '2')
    })
///---------------------------------------------------------------------------------------------------------------------------------------------

    function checkAccessToken(headerObj, res, callback, require_type = "") {
        helper.Dlog(headerObj.access_token);
        helper.CheckParameterValid(res, headerObj, ["access_token"], () => {
            db.query("SELECT `user_id`, `username`, `user_type`, `name`, `email`, `mobile`, `mobile_code`,  `auth_token`, `dervice_token`, `status` FROM `user_detail` WHERE `auth_token` = ? AND `status` = ? ", [headerObj.access_token, "1"], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                helper.Dlog(result);

                if (result.length > 0) {
                    if (require_type != "") {
                        if (require_type == result[0].user_type) {
                            return callback(result[0]);
                        } else {
                            res.json({ "status": "0", "code": "404", "message": "Access denied. Unauthorized user access." })
                        }
                    } else {
                        return callback(result[0]);
                    }
                } else {
                    res.json({ "status": "0", "code": "404", "message": "Access denied. Unauthorized user access." })
                }
            })
        })

    }
}