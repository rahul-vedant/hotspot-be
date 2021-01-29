'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Restaurant extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Restaurant.belongsTo(models.RestaurantCategory)
        }
    }
    Restaurant.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        restaurant_name: {
            type: DataTypes.STRING(45),
            allowNull: false,
        },
        restaurant_image_url: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        owner_name: {
            type: DataTypes.STRING(45),
            allowNull: false,
        },
        owner_email: {
            type: DataTypes.STRING(45),
            allowNull: false,
        },
        location: {
            type: DataTypes.ARRAY(DataTypes.FLOAT),
            allowNull: false,
        },
        address: {
            type: DataTypes.STRING(45),
        },
        deliveries_per_shift: {
            type: DataTypes.INTEGER,
        },
        cut_off_time: {
            type: DataTypes.INTEGER,
        },
        working_hours_from: {
            type: DataTypes.INTEGER,
        },
        working_hours_to: {
            type: DataTypes.INTEGER,
        },
        order_type: {
            type: DataTypes.INTEGER,
        },
        restaurant_category_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        status: {
            type: DataTypes.INTEGER,
        },
        
        is_deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        
    }, {
        sequelize,
        underscored: true,
            tableName: 'restaurants',
            modelName: 'Restaurant',
    });
    return Restaurant;
};