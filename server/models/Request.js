import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  url: { type: String, required: true },
  method: { type: String, required: true },
  requestHeaders: { type: Object, default: {} },
  requestBody: { type: String, default: '' },
  status: { type: Number },
  responseTime: { type: Number },
  payloadSize: { type: Number },
  protocol: { type: String },
  host: { type: String },
  port: { type: Number },
  responseHeaders: { type: Object, default: {} },
  contentType: { type: String },
  responseBody: { type: String, default: '' },
  securityScore: { type: Number },
  protocolIntelligence: {
    scheme: { type: String },
    host: { type: String },
    port: { type: Number },
    connectionType: { type: String },
    contentEncoding: { type: String },
    transferEncoding: { type: String },
    server: { type: String },
    cacheControl: { type: String },
    contentType: { type: String },
    protocolVersion: { type: String }
  },
  createdAt: { type: Date, default: Date.now }
});

const Request = mongoose.model('Request', requestSchema);
export default Request;
