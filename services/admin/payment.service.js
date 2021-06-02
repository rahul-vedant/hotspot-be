const models = require('../../models');
const {sequelize}=require('../../models');
const { Op } = require("sequelize");
const utility = require('../../utils/utilityFunctions');
const sendMail = require('../../utils/mail');
const constants = require("../../constants");

let offlineModes = [
            constants.PAYMENT_MODE['Offline/Check'],
            constants.PAYMENT_MODE['Offline/Cash'],
            constants.PAYMENT_MODE['Offline/Other']
]

let onlineModes = [
    constants.PAYMENT_MODE['Online/NEFT'],
    constants.PAYMENT_MODE['Online/IMPS'],
    constants.PAYMENT_MODE['Online/Other']
]

let paymentModes = {
    1: 'Online/NEFT',
    2: 'Online/IMPS',
    3: 'Online/Other',
    4: 'Offline/Check',
    5: 'Offline/Cash',
    6: 'Offline/Other',
}




const sendDriverPaymentEmail= async (params) => {
    let driverPayment = await models.DriverPayment.findOne({
        where: {
            payment_id:params.payment_id,
        }
    })

    let currentDriverPayment = await utility.convertPromiseToObject(driverPayment);

    let orderDeliveries = await utility.convertPromiseToObject(
        await models.OrderDelivery.findAndCountAll({
            attributes: [
                'id', 'delivery_id', 'order_count', 'driver_fee', 'delivery_datetime',
                [sequelize.json('delivery_details.hotspot.name'),'hotspot_name'],
            ],
            where: {
                driver_id:currentDriverPayment.driver_id,
                [Op.and]: [
                    sequelize.where(sequelize.fn('date', sequelize.col('delivery_datetime')), '>=', currentDriverPayment.from_date),
                    sequelize.where(sequelize.fn('date', sequelize.col('delivery_datetime')),'<=',currentDriverPayment.to_date)
                ]
                
            }
        })
    )

    let totalDriverFee = orderDeliveries.rows.reduce((result, orderDelivery) =>result+parseFloat(orderDelivery.driver_fee), 0);

    let driver = await utility.convertPromiseToObject(await models.Driver.findByPk(currentDriverPayment.driver_id));

    let headerHTML = `<div
        style="
            position: relative;
        ">
        Hello, Transfer of payment has been submitted to your account. Payment may take up to 1-3 business
    days to show in your account. Thank you!<br><br>
    `;

    let bottomHTML = `</div><br><br>
    <div
        style="
            position: absolute;
            width: 100%;
            height: 100%;
        ">
        <img src="https://hotspot-customer-profile-picture1.s3.amazonaws.com/admin/other/download%20%288%29_1622468052927.png" 
            style="
                    opacity:0.5;
                    margin-top:5px;;
                "/>
    </div><br>`;

    let bodyHTML = `<div style="margin-top:10px;">
        <table>
            <tr><td><strong>Account Name</strong></td><td>:</td><td>${currentDriverPayment.payment_details.driver.DriverBankDetail.account_holder_name}</td></tr>
            <tr><td><strong>Bank Name</strong></td><td>:</td><td>${currentDriverPayment.payment_details.driver.DriverBankDetail.bank_name}</td></tr>
            <tr><td><strong>Account Number</strong></td><td>:</td><td>XXXX${currentDriverPayment.payment_details.driver.DriverBankDetail.account_number.slice(-4)}</td></tr>
            <tr><td><strong>Payment Type</strong></td><td>:</td><td>Transfer</td></tr>
            <tr><td><strong>Payment Dates</strong></td><td>:</td><td>${currentDriverPayment.from_date.slice(5,7)}/${currentDriverPayment.from_date.slice(8,10)} - ${currentDriverPayment.to_date.slice(5,7)}/${currentDriverPayment.to_date.slice(8,10)}</td></tr>
        </table>
    </div><br><br>`;
    
    bodyHTML +=`<p><strong>Total No. of Deliveries</strong>: ${orderDeliveries.count}</p>`
        
    bodyHTML += `<table cellspacing=20 style="margin-top:10px;"><tr>
        <th style="text-align:center;">Delivery#</th>
        <th style="text-align:center;">Delivery ID</th>
        <th style="text-align:center;">Hotspot Name</th>
        <th style="text-align:center;">Date</th>
        <th style="text-align:center;">Driver Fee</th>
    </tr>`

    let snCounter = 1;
    for (let orderDelivery of orderDeliveries.rows) {
        bodyHTML += `<tr>
            <td style="text-align:center;">${snCounter++}</td>
            <td style="text-align:center;">${orderDelivery.delivery_id}</td>
            <td style="text-align:center;">${orderDelivery.hotspot_name}</td>
            <td style="text-align:center;">${utility.getDateInUSFormat(orderDelivery.delivery_datetime)}</td>
            <td style="text-align:center;">${orderDelivery.driver_fee}</td>
        </tr>`
    }

    bodyHTML += `<tr>
        <td style="text-align:center;" colspan="4"><strong></strong></td>
        <td style="text-align:center;border-top:5px double black;"><strong>${Math.round(parseFloat(totalDriverFee)*100)/100}</strong></td>
    </tr></table>`

    let mailOptions = {
        from: `Hotspot <${process.env.SG_EMAIL_ID}>`,
        to: driver.email,
        subject: `HOTSPOT PAYMENT ${currentDriverPayment.from_date.slice(5,7)}/${currentDriverPayment.from_date.slice(8,10)} - ${currentDriverPayment.to_date.slice(5,7)}/${currentDriverPayment.to_date.slice(8,10)}`,
        html: headerHTML + bodyHTML + bottomHTML,
    };

    sendMail.send(mailOptions)

     return true;

}
    
const sendRestaurantPaymentEmail= async (params) => {
    let restaurantPayment = await models.RestaurantPayment.findOne({
        where: {
            payment_id:params.payment_id,
        }
    })

    let currentRestaurantPayment = await utility.convertPromiseToObject(restaurantPayment);

    let orders = await utility.convertPromiseToObject(
        await models.Order.findAndCountAll({
            attributes: [
                'id', 'order_id', 'delivery_datetime','type',
                [sequelize.json('order_details.hotspot.name'), 'hotspot_name'],
                [sequelize.json('order_details.customer.name'), 'customer_name'],
                [sequelize.cast(sequelize.json("order_details.restaurant.fee"), 'float'),'restaurant_fee']
            ],
            where: {
                type:constants.ORDER_TYPE.delivery,
                restaurant_id:currentRestaurantPayment.restaurant_id,
                [Op.and]: [
                    sequelize.where(sequelize.fn('date', sequelize.col('delivery_datetime')), '>=', currentRestaurantPayment.from_date),
                    sequelize.where(sequelize.fn('date', sequelize.col('delivery_datetime')),'<=',currentRestaurantPayment.to_date)
                ]
                
            }
        })
    )
    
    
    let totalRestaurantFee = orders.rows.reduce((result, order) =>result+parseFloat(order.restaurant_fee), 0);

    let restaurant = await utility.convertPromiseToObject(await models.Restaurant.findByPk(currentRestaurantPayment.restaurant_id));

    let headerHTML = `<div
        style="
            position: relative;
        ">
        Hello, Transfer of payment has been submitted to your account. Payment may take up to 1-3 business
    days to show in your account. Thank you!<br><br>
    `;

    let bottomHTML = `</div><br><br>
    <div
        style="
            position: absolute;
            width: 100%;
            height: 100%;
        ">
        <img src="https://hotspot-customer-profile-picture1.s3.amazonaws.com/admin/other/download%20%288%29_1622468052927.png" 
            style="
                    opacity:0.5;
                    margin-top:5px;;
                "/>
    </div><br>`;

    let bodyHTML = `<p>${restaurant.restaurant_name}</p>`;
        
    bodyHTML += `<div style="margin-top:10px;">
        <table>
            <tr><td><strong>Bank Name</strong></td><td>:</td><td>Bank of America</td></tr>
            <tr><td><strong>Account Number</strong></td><td>:</td><td>XXXX7803</td></tr>
            <tr><td><strong>Payment Type</strong></td><td>:</td><td>Transfer</td></tr>
            <tr><td><strong>Payment Dates</strong></td><td>:</td><td>${currentRestaurantPayment.from_date.slice(5,7)}/${currentRestaurantPayment.from_date.slice(8,10)} - ${currentRestaurantPayment.to_date.slice(5,7)}/${currentRestaurantPayment.to_date.slice(8,10)}</td></tr>
        </table>
    </div><br><br>`;
    
    bodyHTML += `<table cellspacing=20 style="margin-top:10px;"><tr>
        <th style="text-align:center;">Order#</th>
        <th style="text-align:center;">Order ID</th>
        <th style="text-align:center;">Customer Name</th>
        <th style="text-align:center;">Order Type</th>
        <th style="text-align:center;">Date</th>        
        <th style="text-align:center;">Restaurant Fee</th>
    </tr>`

    let snCounter = 1;
    for (let order of orders.rows) {
        bodyHTML += `<tr>
            <td style="text-align:center;">${snCounter++}</td>
            <td style="text-align:center;">${order.order_id}</td>
            <td style="text-align:center;">${order.customer_name}</td>
            <td style="text-align:center;">${order.type==1?'Delivery':'Pickup'}</td>
            <td style="text-align:center;">${utility.getDateInUSFormat(order.delivery_datetime)}</td>
            <td style="text-align:center;">${order.restaurant_fee}</td>
        </tr>`
    }


    bodyHTML += `<tr>
        <td style="text-align:center;" colspan="5"><strong></strong></td>
        <td style="text-align:center;border-top:5px double black;"><strong>${Math.round(parseFloat(totalRestaurantFee)*100)/100}</strong></td>
    </tr></table>`


    let mailOptions = {
        from: `Hotspot <${process.env.SG_EMAIL_ID}>`,
        to: restaurant.owner_email,
        subject: `HOTSPOT PAYMENT ${currentRestaurantPayment.from_date.slice(5,7)}/${currentRestaurantPayment.from_date.slice(8,10)} - ${currentRestaurantPayment.to_date.slice(5,7)}/${currentRestaurantPayment.to_date.slice(8,10)}`,
        html: headerHTML+bodyHTML+bottomHTML,
    };        
    
    sendMail.send(mailOptions)
    
    return true;
    }

module.exports = {
    
    paymentDriver: async (params) => {
    
        if (offlineModes.includes(parseInt(params.payment_mode)))
        {            
            sendDriverPaymentEmail(params);
        }
        else if (onlineModes.includes(parseInt(params.payment_mode)))
        {
            //payment code... 
            sendDriverPaymentEmail(params);
        }
        
    },

    paymentRestaurant: async (params) => {

        console.log(params)

        if (offlineModes.includes(parseInt(params.payment_mode)))
        {            
            sendRestaurantPaymentEmail(params);
        }
        else if (onlineModes.includes(parseInt(params.payment_mode)))
        {
            //payment code... 
            sendRestaurantPaymentEmail(params);
        }
       
    }

}