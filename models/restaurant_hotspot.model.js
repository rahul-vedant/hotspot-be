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
            RestaurantHotspot.belongsTo(models.HotspotLocation)
            RestaurantHotspot.belongsTo(models.Restaurant)
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

        is_deleted: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },

    }, {
        sequelize,
        underscored: true,
        tableName: 'restaurant_hotspots',
        modelName: 'RestaurantHotspot',
    });
    return RestaurantHotspot;
};