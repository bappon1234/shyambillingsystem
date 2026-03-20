import mongoose, { Schema, models, model } from 'mongoose'

const BillItemSchema = new Schema(
  {
    sl: Number,
    description: String,

    packQty: { type: Number, default: 1 }, // 1 patta = kitne pc
    unitType: { type: String, enum: ['patta', 'pc'], default: 'patta' },

    qty: Number, // customer ne kitna liya
    mrp: Number, // 1 patta ka MRP
    discount: { type: Number, default: 0 },

    rate: Number, // selected unit ka rate
    total: Number,
  },
  { _id: false }
)

const BillSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String },
    paymentMethod: { type: String, default: 'Cash' },
    items: [BillItemSchema],
    subtotal: Number,
    totalDiscount: Number,
    roundOff: Number,
    grandTotal: Number,
    amountReceived: Number,
    balance: Number,
    amountInWords: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

export default models.Bill || model('Bill', BillSchema)