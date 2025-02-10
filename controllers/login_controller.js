var db = require('./../helpers/db_helpers')
var helper = require('./../helpers/helpers')
var image_base_url = helper.ImagePath();

var deliver_price = 2.0

module.exports.controller = (app, io, socket_list) => {

    const msg_success = "successfully";
    const msg_fail = "fail";
    const msg_invalidUser = "invalid username and password";
    const msg_already_register = "this email already register ";
    const msg_added_favorite = "add favorite list successfully";
    const msg_removed_favorite = "removed favorite list successfully";
    const msg_invalid_item = "invalid product item";
    const msg_add_to_item = "item added into cart successfully ";
    const msg_remove_to_cart = "item remove form cart successfully"
    const msg_add_address = "Address added successfully"
    const msg_update_address = "Address updated successfully"
    const msg_remove_address = "Address removed successfully"

    const msg_add_payment_method = "payment method added successfully"
    const msg_remove_payment_method = "payment method removed successfully"


    // -------------------------------------------------using api here-----------------------------------------------------------

    // -------------------------------------------------using Login   User pdofile  here-----------------------------------------------------------

    app.post('/api/app/login', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;

        helper.CheckParameterValid(res, reqObj, ["email", "password", "dervice_token"], () => {

            var auth_token = helper.createRequestToken();
            db.query("UPDATE `user_detail` SET `auth_token`= ?,`dervice_token`=?,`modify_date`= NOW() WHERE `user_type` = ? AND `email` = ? AND `password` = ? AND `status` = ?", [auth_token, reqObj.dervice_token, "1", reqObj.email, reqObj.password, "1"], (err, result) => {

                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                if (result.affectedRows > 0) {


                    db.query('SELECT `user_id`, `username`, `name`, `email`, `mobile`, `mobile_code`,`auth_token`, `status`, `created_date` FROM `user_detail` WHERE `email` = ? AND `password` = ? AND `status` = "1" ', [reqObj.email, reqObj.password], (err, result) => {

                        if (err) {
                            helper.ThrowHtmlError(err, res);
                            return
                        }

                        if (result.length > 0) {
                            res.json({ "status": "1", "payload": result[0], "message": msg_success })
                        } else {
                            res.json({ "status": "0", "message": msg_invalidUser })
                        }
                    })
                } else {
                    res.json({ "status": "0", "message": msg_invalidUser })
                }

            })
        })
    })
    
    app.post('/api/app/sign_up', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;

        helper.CheckParameterValid(res, reqObj, ["username", "email", "password", "dervice_token","mobile"], () => {

            db.query('SELECT `user_id`, `status` FROM `user_detail` WHERE `email` = ? ', [reqObj.email], (err, result) => {

                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                if (result.length > 0) {
                    res.json({ "status": "1", "payload": result[0], "message": msg_already_register })
                } else {

                    var auth_token = helper.createRequestToken();
                    db.query("INSERT INTO `user_detail`( `username`, `email`, `password`,`mobile` ,`auth_token`, `dervice_token`, `created_date`, `modify_date`) VALUES (?,?,?, ?,?, NOW(), NOW())", [reqObj.username, reqObj.email, reqObj.password, reqObj.mobile,auth_token, reqObj.dervice_token], (err, result) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res);
                            return
                        }

                        if (result) {
                            db.query('SELECT `user_id`, `username`, `name`, `email`, `mobile`, `mobile_code`, `password`, `auth_token`, `status`, `created_date`  FROM `user_detail` WHERE `user_id` = ? AND `status` = "1" ', [result.insertId], (err, result) => {

                                if (err) {
                                    helper.ThrowHtmlError(err, res);
                                    return
                                }

                                if (result.length > 0) {
                                    res.json({ "status": "1", "payload": result[0], "message": msg_success })
                                } else {
                                    res.json({ "status": "0", "message": msg_invalidUser })
                                }
                            })
                        } else {
                            res.json({ "status": "0", "message": msg_fail })
                        }
                    })

                }
            })
        })
    })

    app.post('/api/app/userprofile', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body;

        checkAccessToken(req.headers, res, (userid) => {
            db.query('SELECT * FROM user_detail WHERE user_id =?' , [reqObj.user_id], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                res.json({
                    "status": "1",
                    "payload": result,
                    "message": msg_success
                })

            })
        }, '1')
    })

    app.post('/api/app/update_profile', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body
    
        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["username", "name", "mobile", "mobile_code"], () => {
                db.query("UPDATE `user_detail` SET `username`=?,`name`=?,`mobile`=?,`mobile_code`=?,`modify_date`=NOW() WHERE `user_id` = ? AND `status` = 1", [reqObj.username, reqObj.name, reqObj.mobile, reqObj.mobile_code, userObj.user_id], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }
    
                    if (result.affectedRows > 0) {
                        db.query('SELECT `user_id`, `username`, `name`, `email`, `mobile`, `mobile_code`, `password`, `auth_token`, `status`, `created_date` FROM `user_detail` WHERE `user_id` = ? AND `status` = "1" ', [userObj.user_id], (err, result) => {
    
                            if (err) {
                                helper.ThrowHtmlError(err, res);
                                return
                            }
    
                            if (result.length > 0) {
                                res.json({ "status": "1", "payload": result[0], "message": msg_success })
                            } else {
                                res.json({ "status": "0", "message": msg_invalidUser })
                            }
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })
            })
    
        })
    })
// ------------------------------------------category_list list---------------------------------------------------------------------------


    app.post('/api/app/explore_category_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body;

        checkAccessToken(req.headers, res, (userObj) => {

            db.query("SELECT `cat_id`, `cat_name`, `image` , `color` FROM `category_detail` WHERE `status` = 1 ", [], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                res.json({
                    "status": "1",
                    "payload": result,
                    "message": msg_success
                })

            })
        }, '1')
    })

// ------------------------------------------product list---------------------------------------------------------------------------

    app.post('/api/app/explore_category_items_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body;

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["cat_id"], () => {


                db.query("SELECT `pd`.`prod_id`, `pd`.`cat_id`, `pd`.`brand_id`,  `pd`.`type_id`, `pd`.`name`, `pd`.`detail`, `pd`.`unit_name`, `pd`.`unit_value`, `pd`.`nutrition_weight`, `pd`.`price`, `pd`.`created_date`, `pd`.`modify_date`, `cd`.`cat_name` FROM  `product_detail` AS `pd` " +
                    "INNER JOIN `category_detail` AS `cd` ON `pd`.`cat_id` = `cd`.`cat_id` AND `pd`.`status` = 1 " +
                    " WHERE `cd`.`cat_id` = ? AND `cd`.`status` = '1' GROUP BY `pd`.`prod_id`  ", [reqObj.cat_id], (err, result) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res);
                            return
                        }

                        res.json({
                            "status": "1",
                            "payload": result,
                            "message": msg_success
                        })

                    })
            })
        }, '1')
    })

    app.post('/api/app/product_detail', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (uObj) => {
            helper.CheckParameterValid(res, reqObj, ["prod_id"], () => {
    
                db.query('SELECT * FROM product_detail WHERE prod_id=?', [ reqObj.prod_id], (err, results) => {
                    if (!err) {
                        res.send(results[0]);
                    } else {
                        console.log(err)
                    }
                });
            })
        }, "1")
    
    })

// ------------------------------------------address-------------------------------------------------------------------------------

    app.post('/api/app/add_delivery_address', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["roadno", "type_name", "phone", "address", "city", "state", "postal_code"], () => {
                db.query("INSERT INTO `address_detail`(`user_id`, `roadno`, `phone`, `address`, `city`, `state`, `type_name`, `postal_code`) VALUES (?,?,?, ?,?,?, ?,?) ", [userObj.user_id, reqObj.roadno, reqObj.phone, reqObj.address, reqObj.city, reqObj.state, reqObj.type_name, reqObj.postal_code], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }

                    if (result) {
                        res.json({
                            "status": "1",
                            "message": msg_add_address
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })
            })
        })
    })

    app.post('/api/app/update_delivery_address', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["address_id", "roadno", "type_name", "phone", "address", "city", "state", "postal_code"], () => {
                db.query("UPDATE `address_detail` SET `roadno`=? ,`phone`=? ,`address`=? ,`city`=? ,`state`=? ,`type_name`=? ,`postal_code`=?, `modify_date`= NOW() WHERE  `address_id` = ? AND `status` = 1 ", [reqObj.roadno, reqObj.phone, reqObj.address, reqObj.city, reqObj.state, reqObj.type_name, reqObj.postal_code, reqObj.address_id], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }

                    if (result.affectedRows > 0) {
                        res.json({
                            "status": "1",
                            "message": msg_update_address
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })
            })
        })
    })

    app.post('/api/app/delete_delivery_address', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["address_id"], () => {
                  db.query('DELETE FROM address_detail WHERE address_id=?', [reqObj.address_id], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }

                    if (result.affectedRows > 0) {
                        res.json({
                            "status": "1",
                            "message": msg_remove_address
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })
            })
        })
    })

    app.post('/api/app/mark_default_delivery_address', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["address_id"], () => {
                db.query("UPDATE `address_detail` SET `is_default` = (CASE WHEN `address_id` = ? THEN 1 ELSE 0 END) , `modify_date`= NOW() WHERE `user_id` = ? AND `status` = 1 ", [reqObj.address_id, userObj.user_id], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }

                    if (result.affectedRows > 0) {
                        res.json({
                            "status": "1",
                            "message": msg_success
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })
            })
        })
    })

    app.post('/api/app/delivery_address', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body;
        checkAccessToken(req.headers, res, (userObj) => {

            db.query("SELECT `address_id`, `roadno`, `phone`, `address`, `city`, `state`, `type_name`, `postal_code`, `is_default` FROM `address_detail` WHERE `user_id` = ? AND `status` = 1 ", [userObj.user_id], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                res.json({
                    "status": "1",
                    "payload": result,
                    "message": msg_success
                })
            })

        })
    })
// ------------------------------------------order-------------------------------------------------------------------------------


    app.post('/api/app/userAddorder', (req, res) => {
        var responseJson = JSON.stringify(req.body);
        var users = {
            "address_id":req.body.address_id,
            "user_id": req.body.user_id,
            "invoic": req.body.invoic,
            "product_details":responseJson,
            "discount_amt": req.body.discount_amt,
            "total_amt": req.body.total_amt,
            "delivery_amt": req.body.delivery_amt,
            "subtoal": req.body.subtoal,
            "order_status": req.body.order_status,
            "tax":req.body.tax,
            "payment_type":req.body.payment_type,
        }
        
        db.query('INSERT INTO  user_order SET ?', users, function (error, results, fields) {
            if (error) {
                res.json({
                    status: false,
                    message: error + 'there are some error with query'
                })
            } 
            else {
                res.json({
                    status: true,
                    data: results,
                    message: 'Order placed '
                })
            }
        })
    })

    app.post('/api/app/userOrderlist', (req, res) => {
        var reqObj = req.body;
        console.log(reqObj)


        db.query('SELECT * FROM  user_order WHERE user_id = ' + reqObj.user_id + ' ORDER BY orders_id DESC  ', (err, result) => {
            if (err) throw err;
            else
            {
                res.json({
                    status: true,
                    data:  res.end(JSON.stringify(result)),
                    message: 'Order placed '
                })
            }

           
        })
    })

    app.post('/api/app/userOrderlistDetialsById', (req, res) => {
        var reqObj = req.body;
        console.log(reqObj)
        db.query("SELECT * FROM `user_order` AS `od` " +
            "INNER JOIN `address_detail` AS `ad` ON  `od`.`user_id` = `ad`.`user_id` " +
            "INNER JOIN `user_detail` AS `user` ON  `user`.`user_id` = `od`.`user_id` " +
            "WHERE `od`.`orders_id` = ? GROUP BY `od`.`orders_id` ", [reqObj.orderid], (err, result) => {
                console.log(result)
            if (err) throw err;
            else
            {
                res.json({ "status": "1", "payload": result[0], "message": msg_success })
            }
        })
    })


// ------------------------------------------order-------------------------------------------------------------------------------





    app.post('/api/app/add_remove_favorite', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body;

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["prod_id"], () => {
                db.query("SELECT `fav_id`, `prod_id` FROM `favorite_detail` WHERE `prod_id` = ? AND `user_id` = ? AND `status` = '1' ", [reqObj.prod_id, userObj.user_id], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }

                    if (result.length > 0) {
                        // Already add Favorite List To Delete Fave
                        db.query("DELETE FROM `favorite_detail` WHERE `prod_id` = ? AND `user_id` = ? ", [reqObj.prod_id, userObj.user_id], (err, result) => {

                            if (err) {
                                helper.ThrowHtmlError(err, res);
                                return
                            } else {
                                res.json({
                                    "status": "1",
                                    "message": msg_removed_favorite
                                })
                            }
                        })

                    } else {
                        // Not Added  Favorite List TO Add
                        db.query("INSERT INTO `favorite_detail`(`prod_id`, `user_id`) VALUES (?,?) ", [
                            reqObj.prod_id, userObj.user_id
                        ], (err, result) => {
                            if (err) {
                                helper.ThrowHtmlError(err, res);
                                return
                            }

                            if (result) {
                                res.json({
                                    "status": "1",
                                    "message": msg_added_favorite
                                })
                            } else {
                                res.json({
                                    "status": "0",
                                    "message": msg_fail
                                })
                            }
                        })

                    }
                })
            })
        }, '1')
    })

    app.post('/api/app/favorite_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body;

        checkAccessToken(req.headers, res, (userObj) => {

            db.query("SELECT `fd`.`fav_id`, `pd`.`prod_id`, `pd`.`cat_id`, `pd`.`brand_id`,  `pd`.`type_id`, `pd`.`name`, `pd`.`detail`, `pd`.`unit_name`, `pd`.`unit_value`, `pd`.`nutrition_weight`, `pd`.`price`, `pd`.`created_date`, `pd`.`modify_date`, `cd`.`cat_name`, IFNULL( `bd`.`brand_name`, '' ) AS `brand_name` , `td`.`type_name`, IFNULL(`od`.`price`, `pd`.`price` ) as `offer_price`, IFNULL(`od`.`start_date`,'') as `start_date`, IFNULL(`od`.`end_date`,'') as `end_date`, (CASE WHEN `od`.`offer_id` IS NOT NULL THEN 1 ELSE 0 END) AS `is_offer_active`, 1 AS `is_fav`, (CASE WHEN `imd`.`image` != '' THEN  CONCAT( '" + image_base_url + "' ,'', `imd`.`image` ) ELSE '' END) AS `image` FROM `favorite_detail` AS  `fd` " +
                "INNER JOIN  `product_detail` AS `pd` ON  `pd`.`prod_id` = `fd`.`prod_id` AND `pd`.`status` = 1 " +
                "INNER JOIN `category_detail` AS `cd` ON `pd`.`cat_id` = `cd`.`cat_id` " +
                "INNER JOIN `image_detail` AS `imd` ON `pd`.`prod_id` = `imd`.`prod_id` AND `imd`.`status` = 1 " +
                "LEFT JOIN `brand_detail` AS `bd` ON `pd`.`brand_id` = `bd`.`brand_id` " +
                "LEFT JOIN `offer_detail` AS `od` ON `pd`.`prod_id` = `od`.`prod_id` AND `od`.`status` = 1 AND `od`.`start_date` <= NOW() AND `od`.`end_date` >= NOW() " +
                "INNER JOIN `type_detail` AS `td` ON `pd`.`type_id` = `td`.`type_id` " +
                " WHERE `fd`.`user_id` = ? AND `fd`.`status` = '1' GROUP BY `pd`.`prod_id` ", [userObj.user_id], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res);
                        return
                    }

                    res.json({
                        "status": "1",
                        "payload": result,
                        "message": msg_success
                    })

                })
        }, '1')
    })

    app.post('/api/app/add_to_cart', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["prod_id", "qty"], () => {

                db.query("Select `prod_id` FROM `product_detail` WHERE  `prod_id` = ? AND `status` = 1 ", [reqObj.prod_id], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return;
                    }

                    if (result.length > 0) {
                        //Valid Item

                        db.query("INSERT INTO `cart_detail`(`user_id`, `prod_id`, `qty`) VALUES (?,?,?) ", [userObj.user_id, reqObj.prod_id, reqObj.qty], (err, result) => {
                            if (err) {
                                helper.ThrowHtmlError(err, res)
                                return
                            }

                            if (result) {
                                res.json({
                                    "status": "1",
                                    "message": msg_add_to_item
                                })
                            } else {
                                res.json({
                                    "status": "0",
                                    "message": msg_fail
                                })
                            }
                        })
                    } else {
                        //Invalid Item
                        res.json({
                            "status": "0",
                            "message": msg_invalid_item
                        })
                    }
                })
            })
        })
    })

    app.post('/api/app/update_cart', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["cart_id", "prod_id", "new_qty"], () => {

                // Valid
                var status = "1"

                if (reqObj.new_qty == "0") {
                    status = "2"
                }
                db.query("UPDATE `cart_detail` SET `qty`= ? , `status`= ?, `modify_date`= NOW() WHERE `cart_id` = ? AND `prod_id` = ? AND `user_id` = ? AND `status` = ? ", [reqObj.new_qty, status, reqObj.cart_id, reqObj.prod_id, userObj.user_id, "1"], (err, result) => {

                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }

                    if (result.affectedRows > 0) {
                        res.json({
                            "status": "1",
                            "message": msg_success
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })

            })
        })
    })

    app.post('/api/app/remove_cart', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["cart_id", "prod_id"], () => {


                db.query("UPDATE `cart_detail` SET `status`= '2', `modify_date`= NOW() WHERE `cart_id` = ? AND `prod_id` = ? AND  `user_id` = ? AND  `status` = ? ", [reqObj.cart_id, reqObj.prod_id, userObj.user_id, "1"], (err, result) => {

                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }

                    if (result.affectedRows > 0) {
                        res.json({
                            "status": "1",
                            "message": msg_remove_to_cart
                        })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })

            })
        })
    })

    app.post('/api/app/cart_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            getUserCart(res, userObj.user_id, (result, total) => {

                var promo_code_id = reqObj.promo_code_id;
                if (promo_code_id == undefined || promo_code_id == null) {
                    promo_code_id = ""
                }

                var deliver_type = reqObj.deliver_type;
                if (deliver_type == undefined || deliver_type == null) {
                    deliver_type = "1"
                }

                db.query(
                    'SELECT `promo_code_id`, `min_order_amount`, `max_discount_amount`, `offer_price` FROM `promo_code_detail` WHERE  `start_date` <= NOW() AND `end_date` >= NOW()  AND `status` = 1  AND `promo_code_id` = ? ;'
                    , [reqObj.promo_code_id], (err, pResult) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res)
                            return
                        }

                        var deliver_price_amount = 0.0

                        if (deliver_type == "1") {
                            deliver_price_amount = deliver_price
                        } else {
                            deliver_price_amount = 0.0;
                        }


                        var final_total = total
                        var discountAmount = 0.0

                        if (promo_code_id != "") {
                            if (pResult.length > 0) {
                                //Promo Code Apply & Valid

                                if (final_total > pResult[0].min_order_amount) {

                                    if (pResult[0].type == 2) {
                                        // Fixed Discount
                                        discountAmount = pResult[0].offer_price
                                    } else {
                                        //% Per

                                        var disVal = final_total * (pResult[0].offer_price / 100)

                                        helper.Dlog("disVal: " + disVal);

                                        if (pResult[0].max_discount_amount <= disVal) {
                                            //Max discount is more then disVal
                                            discountAmount = pResult[0].max_discount_amount
                                        } else {
                                            //Max discount is Small then disVal
                                            discountAmount = disVal
                                        }
                                    }


                                } else {
                                    res.json({
                                        'status': "0",
                                        "payload": result,
                                        "total": total.toFixed(2),
                                        "deliver_price_amount": deliver_price_amount.toFixed(2),
                                        "discount_amount": 0,
                                        "user_pay_price": (final_total + deliver_price_amount).toFixed(2),
                                        'message': "Promo Code not apply need min order: $" + pResult[0].min_order_amount
                                    })
                                    return
                                }

                            } else {
                                //Promo Code Apply not Valid
                                res.json({
                                    'status': "0",
                                    "payload": result,
                                    "total": total.toFixed(2),
                                    "deliver_price_amount": deliver_price_amount.toFixed(2),
                                    "discount_amount": 0,
                                    "user_pay_price": (final_total + deliver_price_amount).toFixed(2),
                                    'message': "Invalid Promo Code"
                                })
                                return
                            }
                        }

                        var user_pay_price = final_total + deliver_price_amount + - discountAmount;
                        res.json({
                            "status": "1",
                            "payload": result,
                            "total": total.toFixed(2),
                            "deliver_price_amount": deliver_price_amount.toFixed(2),
                            "discount_amount": discountAmount.toFixed(2),
                            "user_pay_price": user_pay_price.toFixed(2),
                            "message": msg_success
                        })

                    })


            })
        })
    })


    app.post('/api/app/promo_code_list', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {


            db.query("SELECT `promo_code_id`, `code`, `title`, `description`, `type`, `min_order_amount`, `max_discount_amount`, `offer_price`, `start_date`, `end_date`, `created_date`, `modify_date` FROM `promo_code_detail` WHERE `start_date` <= NOW() AND `end_date` >= NOW()  AND `status` = 1 ORDER BY `start_date` ", [], (err, result) => {

                if (err) {
                    helper.ThrowHtmlError(err, res)
                    return
                }

                res.json({
                    'status': '1',
                    'payload': result,
                    'message': msg_success
                })
            })


        }, "1")
    })

    app.post('/api/app/order_payment_transaction', (req, res) => {
        helper.Dlog(req.body)
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["order_id", "payment_transaction_id", "payment_status", "transaction_payload"], () => {
                db.query('INSERT INTO `order_payment_detail`( `order_id`, `transaction_payload`, `payment_transaction_id`, `status`) VALUES ( ?,?,?, ? )', [reqObj.order_id, reqObj.transaction_payload, reqObj.payment_transaction_id, reqObj.payment_status], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }

                    if (result) {

                        var message = reqObj.payment_status == "2" ? "successfully" : "fail"

                        db.query("INSERT INTO `notification_detail`( `ref_id`, `user_id`, `title`, `message`, `notification_type`) VALUES (?,?,?, ?,?)", [reqObj.order_id, userObj.user_id,
                        "Order payment " + message, "your order #" + reqObj.order_id + " payment " + message + ".", "2"], (err, iResult) => {
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

                        db.query("UPDATE `order_detail` SET `payment_status`=?,`modify_date`= NOW() WHERE `order_id` = ? AND `user_id` = ? AND `status` = 1", [reqObj.payment_status == "1" ? "2" : "3", reqObj.order_id, userObj.user_id], (err, uResult) => {
                            if (err) {
                                helper.ThrowHtmlError(err);
                                return
                            }

                            if (uResult.affectedRows > 0) {



                                helper.Dlog("order payment status update done")
                            } else {
                                helper.Dlog("order payment status update fail")
                            }
                        })
                        res.json({
                            'status': "1"
                            , 'message': "your order place successfully"
                        })
                    } else {
                        res.json({
                            'status': "0"
                            , 'message': msg_fail
                        })
                    }
                })
            })
        })
    })


    app.post('/api/app/notification_list', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            db.query("SELECT `notification_id`, `ref_id`, `title`, `message`, `notification_type`, `is_read`, `created_date` FROM `notification_detail` WHERE `user_id` = ? AND `status` = 1", [userObj.user_id], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                res.json({
                    "status": "1",
                    "payload": result,
                    "message": msg_success
                })
            })
        }, "1")
    })

    app.post('/api/app/notification_read_all', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            db.query("UPDATE `notification_detail` SET `is_read` = '2', `modify_date` = NOW() WHERE `user_id` = ? AND `status` = 1", [userObj.user_id], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res);
                    return
                }

                if (result.affectedRows > 0) {
                    res.json({
                        "status": "1",
                        "message": msg_success
                    })
                } else {
                    res.json({
                        "status": "0",
                        "message": msg_fail
                    })
                }

            })
        }, "1")
    })

 
    app.post('/api/app/change_password', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body

        checkAccessToken(req.headers, res, (userObj) => {
            helper.CheckParameterValid(res, reqObj, ["current_password", "new_password"], () => {
                db.query("UPDATE `user_detail` SET `password`=?, `modify_date`=NOW() WHERE `user_id` = ? AND `password` = ?", [reqObj.new_password, userObj.user_id, reqObj.current_password], (err, result) => {
                    if (err) {
                        helper.ThrowHtmlError(err, res)
                        return
                    }

                    if (result.affectedRows > 0) {
                        res.json({ "status": "1", "message": msg_success })
                    } else {
                        res.json({
                            "status": "0",
                            "message": msg_fail
                        })
                    }
                })
            })

        }, "1")
    })

    app.post('/api/app/forgot_password_request', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body

        helper.CheckParameterValid(res, reqObj, ["email"], () => {
            db.query("SELECT `user_id` FROM `user_detail` WHERE `email` = ? ", [reqObj.email], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res)
                    return
                }

                if (result.length > 0) {
                    var reset_code = helper.createNumber()
                    db.query("UPDATE `user_detail` SET `reset_code` = ? WHERE `user_id` = ? ", [reset_code, result[0].user_id], (err, uResult) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res)
                            return
                        }


                        if (uResult.affectedRows > 0) {
                            res.json({ "status": "1", "message": msg_success })
                        } else {
                            res.json({
                                "status": "0",
                                "message": msg_fail
                            })
                        }
                    })

                } else {
                    res.json({
                        "status": "0",
                        "message": "user not exits"
                    })
                }
            })
        })
    })


    app.post('/api/app/forgot_password_verify', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body

        helper.CheckParameterValid(res, reqObj, ["email", "reset_code"], () => {
            db.query("SELECT `user_id` FROM `user_detail` WHERE `email` = ? AND `reset_code` ", [reqObj.email, reqObj.reset_code], (err, result) => {
                if (err) {
                    helper.ThrowHtmlError(err, res)
                    return
                }

                if (result.length > 0) {
                    var reset_code = helper.createNumber()
                    db.query("UPDATE `user_detail` SET `reset_code` = ? WHERE `user_id` = ? ", [reset_code, result[0].user_id], (err, uResult) => {
                        if (err) {
                            helper.ThrowHtmlError(err, res)
                            return
                        }


                        if (uResult.affectedRows > 0) {
                            res.json({ "status": "1", "payload": { "user_id": result[0].user_id, "reset_code": reset_code }, "message": msg_success })
                        } else {
                            res.json({
                                "status": "0",
                                "message": msg_fail
                            })
                        }
                    })

                } else {
                    res.json({
                        "status": "0",
                        "message": "user not exits"
                    })
                }
            })
        })


    })

    app.post('/api/app/forgot_password_set_password', (req, res) => {
        helper.Dlog(req.body);
        var reqObj = req.body

        helper.CheckParameterValid(res, reqObj, ["user_id", "reset_code", "new_password"], () => {

            var reset_code = helper.createNumber()
            db.query("UPDATE `user_detail` SET `password` = ? , `reset_code` = ?  WHERE `user_id` = ? AND `reset_code` = ? ", [reqObj.new_password, reset_code, reqObj.user_id, reqObj.reset_code], (err, uResult) => {
                if (err) {
                    helper.ThrowHtmlError(err, res)
                    return
                }


                if (uResult.affectedRows > 0) {
                    res.json({ "status": "1", "message": "update password successfully" })
                } else {
                    res.json({
                        "status": "0",
                        "message": msg_fail
                    })
                }
            })
        })


    })
}
function getUserCart(res, user_id, callback) {
    db.query(
        "SELECT `ucd`.`cart_id`, `ucd`.`user_id`, `ucd`.`prod_id`, `ucd`.`qty`, `pd`.`cat_id`, `pd`.`brand_id`, `pd`.`type_id`, `pd`.`name`, `pd`.`detail`, `pd`.`unit_name`, `pd`.`unit_value`, `pd`.`nutrition_weight`, `pd`.`price`, `pd`.`created_date`, `pd`.`modify_date`, `cd`.`cat_name`, ( CASE WHEN `fd`.`fav_id` IS NOT NULL THEN 1 ELSE 0 END ) AS `is_fav` , IFNULL( `bd`.`brand_name`, '' ) AS `brand_name` , `td`.`type_name`, IFNULL(`od`.`price`, `pd`.`price` ) as `offer_price`, IFNULL(`od`.`start_date`,'') as `start_date`, IFNULL(`od`.`end_date`,'') as `end_date`, (CASE WHEN `od`.`offer_id` IS NOT NULL THEN 1 ELSE 0 END) AS `is_offer_active`, (CASE WHEN `imd`.`image` != '' THEN  CONCAT( '" + image_base_url + "' ,'', `imd`.`image` ) ELSE '' END) AS `image`, (CASE WHEN `od`.`price` IS NULL THEN `pd`.`price` ELSE `od`.`price` END) as `item_price`, ( (CASE WHEN `od`.`price` IS NULL THEN `pd`.`price` ELSE `od`.`price` END) * `ucd`.`qty`)  AS `total_price` FROM `cart_detail` AS `ucd` " +
        "INNER JOIN `product_detail` AS `pd` ON `pd`.`prod_id` = `ucd`.`prod_id` AND `pd`.`status` = 1  " +
        "INNER JOIN `category_detail` AS `cd` ON `pd`.`cat_id` = `cd`.`cat_id` " +
        "LEFT JOIN  `favorite_detail` AS `fd` ON  `pd`.`prod_id` = `fd`.`prod_id` AND `fd`.`user_id` = ? AND `fd`.`status`=  1 " +
        "LEFT JOIN `brand_detail` AS `bd` ON `pd`.`brand_id` = `bd`.`brand_id` " +
        "LEFT JOIN `offer_detail` AS `od` ON `pd`.`prod_id` = `od`.`prod_id` AND `od`.`status` = 1 AND `od`.`start_date` <= NOW() AND `od`.`end_date` >= NOW() " +
        "INNER JOIN `image_detail` AS `imd` ON `pd`.`prod_id` = `imd`.`prod_id` AND `imd`.`status` = 1 " +
        "INNER JOIN `type_detail` AS `td` ON `pd`.`type_id` = `td`.`type_id` " +
        "WHERE `ucd`.`user_id` = ? AND `ucd`.`status` = ? GROUP BY `ucd`.`cart_id`, `pd`.`prod_id` ", [user_id, user_id, "1"], (err, result) => {
            if (err) {
                helper.ThrowHtmlError(err, res)
                return
            }

            var total = result.map((cObj) => {
                return cObj.total_price
            }).reduce((patSum, a) => patSum + a, 0)


            return callback(result, total)
        })
}
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