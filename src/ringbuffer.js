/**
 * Created by gd on 16/5/8.
 */
define(function() {
    var Ringbuffer = function(size) {
        this.size = size;
        this.buffer = new ArrayBuffer(size);
        this.dv = new DataView(this.buffer);
        this.head = 0;
        this.tail = 0;
    };

    Ringbuffer.prototype = {
        /* push data to ringbuffer */
        enq: function(buf, length) {
            var dv_buf = new DataView(buf);
            var len = length || buf.byteLength;
            for (var i = 0; i < len; i++) {
                if (this.head == this.size) {
                    this.head = 0;
                }
                this.dv.setUint8(this.head, dv_buf.getUint8(i));
                this.head++;
            }
        },
        deq: function(buf, length, stay) {
            var old_tail = this.tail;
            var dv_buf = new DataView(buf);
            var len = length || buf.byteLength;
            for (var i = 0; i < len; i++) {
                if (this.tail == this.size) {
                    this.tail = 0;
                }
                dv_buf.setUint8(i, this.dv.getUint8(this.tail));
                this.tail++;
            }
            if (stay) {
                this.tail = old_tail;
            }
        },
        deqUint8: function(stay) {
            var bf = new ArrayBuffer(1);
            this.deq(bf, null, stay);
            var dv = new DataView(bf);
            return dv.getUint16(dv, littleEndian);

        },
        deqUint16: function(stay, littleEndian) {
            var bf = new ArrayBuffer(2);
            this.deq(bf, null, stay);
            var dv = new DataView(bf);
            return dv.getUint16(dv, littleEndian);
        },
        deqUint32: function(stay, littleEndian) {
            var bf = new ArrayBuffer(4);
            this.deq(bf, null, stay);
            var dv = new DataView(bf);
            return dv.getUint32(dv, littleEndian);
        },
        getUint8: function(offset) {
            var off = (this.tail + offset) % this.size;
        },
        skip: function(size) {
            this.tail += size;
            this.tail %= this.size;
        },
        used: function() {
            return (this.head - this.tail + this.size) % this.size;
        },
        getBuffer: function() {
            return this.buffer;
        },
        getDataView: function() {
            return this.dv;
        }
    };
    
    function create(size) {
        var rb = new Ringbuffer(size);
        return rb;
    }

    return {
        create: create
    };
});