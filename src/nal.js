/**
 * Created by gd on 16/5/8.
 */
define([
    'prism/queuebuffer',
], function(_queuebuffer) {

    function Nal() {
    }

    Nal.prototype = {
        init: function() {
            this.dv = new DataView(this.buf);
        },
        parse: function() {
            var qb = _queuebuffer.create(this.buf);
            this.forbidden_zero_bit = qb.deqBits(1);
            if (this.forbidden_zero_bit) {
                return;
            }
            this.nal_ref_idc = qb.deqBits(2);
            this.nal_unit_type = qb.deqBits(5);

            var rbsp = new ArrayBuffer(this.buf.byteLength);
            var rbsp_dv = new DataView(rbsp);
            var numBytesInRBSP = 0;
            var numBytesInNALunit = this.buf.byteLength;
            for (var i = 0; i < numBytesInNALunit; i++) {
                if ((i >= 2) &&
                    (this.dv.getUint8(i - 2) === 0x00 && this.dv.getUint8(i - 1) === 0x00 && this.dv.getUint8(i) === 0x03)) {
                    i++;
                }
                rbsp_dv.setUint8(numBytesInRBSP++, this.dv.getUint8(i));
            }
            this.rbsp = rbsp.slice(1, numBytesInRBSP);
        },
    };

    function create(opts) {
        var nal = new Nal();
        for (var i in opts) {
            nal[i] = opts[i];
        }
        nal.init();
        return nal;
    }

    return {
        create: create
    };
});