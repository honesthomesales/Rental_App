"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
exports.Constants = {
    public: {
        Enums: {
            estimate_status: ["draft", "sent", "accepted", "declined", "expired"],
            property_status: ["rented", "empty", "owner_finance", "lease_purchase"],
            property_type: ["house", "singlewide", "doublewide", "land", "loan"],
            slot_transform_kind: [
                "trim",
                "lower",
                "title",
                "digits_only",
                "money_2dp",
                "regex_replace",
                "map",
                "email_lower",
                "date_roll_forward_if_past",
            ],
        },
    },
};
