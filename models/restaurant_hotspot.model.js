'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RestaurantHotspot extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    }
    RestaurantHotspot.init({
        id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },

        hotspot_location_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        restaurant_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            comment: '0=>inactive,1=>active,2=>deleted'
        },


    }, {
        sequelize,
        underscored: true,
        tableName: 'restaurant_hotspots',
        modelName: 'RestaurantHotspot',
    });
    return RestaurantHotspot;
};