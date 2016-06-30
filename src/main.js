/**
 * Created by gd on 16/5/8.
 */
define([
    'prism/nal',
    'prism/ringbuffer',
    'prism/sps',
    'prism/pps',
    'prism/slice',
    'prism/defs',
    'prism/macroblock_layer',
    'prism/dpb',
    'prism/util',
], function(_nal, _ringbuffer, _sps, _pps, _slice, _defs, _macroblock_layer, _dpb, _util) {
    var can = document.createElement('canvas');
    document.body.appendChild(can);

    function Decoder() {
        this.buffer = _ringbuffer.create(1024 * 1024 * 2); // 2M buffer

        this.sps = null;
        this.pps = null;

        this.spses = [];
        this.ppses = [];
        this.currMb = null;
        this.currPic = null;
    }

    Decoder.prototype = {
        resetSample: function() {
            /* xy format */
            this.SL = [];
            for (var x = 0; x < this.width; x++) {
                this.SL[x] = [];
            }
            this.SCb = [];
            this.SCr = [];
            for (var i = 0; i < this.picSize / 2; i++) {
                this.SCb[i] = [];
                this.SCr[i] = [];
            }
            this.currPic = {data: this.SL};
        },
        filterPic: function() {
            for (var i in this.mbs) {
                this.mbs[i].filter();
            }
        },
        decodeNal: function(buf) {
            var dv = new DataView(buf);
            var nal_buf;
            if (dv.getUint32(0) === 0x00000001) {
                nal_buf = buf.slice(4);
            } else if ((dv.getUint32(0) & 0xFFFFFF00) === 0x00000100) {
                nal_buf = buf.slice(3);
            } else {
                return;
            }
            var nal = _nal.create({
                buf: nal_buf,
                decoder: this
            });
            nal.parse();
            switch (nal.nal_unit_type) {
                case _defs.NAL_SPS: /* sps */
                    var sps = _sps.create(nal.rbsp);
                    sps.parse();
                    this.spses[sps.seq_parameter_set_id] = sps;
                    break;
                case _defs.NAL_PPS: /* pps */
                    var pps = _pps.create(nal.rbsp);
                    pps.parse();
                    this.ppses[pps.pic_parameter_set_id] = pps;
                    break;
                case _defs.NAL_SLICE: /* Coded slice of an IDR picture */
                case _defs.NAL_SLICE_IDR:
                    var slice = _slice.create(nal.rbsp, this);
                    slice.nal = nal;
                    slice.parse();
                    if (this.currMb === this.mbs[this.picSizeInMb - 1]) { /* end of pic */
                        this.filterPic();
                        var poc = {};
                        var picOrderCnt = slice.decodePOC(poc);
                        this.dpb.markDecRefPic(slice, nal.nal_unit_type === _defs.NAL_SLICE_IDR ? true : false, slice.frame_num, picOrderCnt);
                        _util.yuv2rgb(this.SL, this.SCb, this.SCr, this.width, this.height, can);
                    }
                    break;
                default:
                    break;
            }
            return nal;
        },
        writeCurrPic: function() {
            for (var mbIdx in this.mbs) {
                var y = Math.floor(mbIdx / this.widthInMb) << 4;
                var x = (mbIdx % this.widthInMb) << 4;
                for (var i = 0; i < 16; i++) {
                    for (var j = 0; j < 16; j++) {
                        this.currPic.data[(y + i) * this.width + x + j] = this.mbs[mbIdx].luma[i][j];
                    }
                }
                var y = Math.floor(mbIdx / this.widthInMb) << 3;
                var x = (mbIdx % this.widthInMb) << 3;
                for (var i = 0; i < 8; i++) {
                    for (var j = 0; j < 8; j++) {
                        this.currPic.data[this.picSize + (y + i) * this.widthInMb * 8 + x + j] = this.mbs[mbIdx].chroma[j][i].cb;
                        this.currPic.data[this.picSize + this.picSize / 4 + (y + i) * this.widthInMb * 8 + x + j] = this.mbs[mbIdx].chroma[j][i].cr;
                    }
                }
            }
        },
        initMbs: function() {
            this.mbs = [];
            var pw = this.widthInMb;
            var ph = this.heightInMb;

            /* allocate mbs memory */
            for (var i = 0; i < pw * ph; i++) {
                for (var j = 0; j < pw; j++) {
                    this.mbs[i] = _macroblock_layer.create({
                        decoder: this,
                        mbaddr: i
                    });
                }
            }

            /* init mb neighbours */
            for (var i = 0; i < ph; i++) {
                for (var j = 0; j < pw; j++) {
                    var mbaddr = i * pw + j;
                    var mb = this.mbs[mbaddr];

                    if (j > 0) {
                        mb.mbA = this.mbs[mbaddr - 1];
                    } else {
                        mb.mbA = null;
                    }

                    if (i > 0) {
                        mb.mbB = this.mbs[mbaddr - pw];
                    } else {
                        mb.mbB = null;
                    }

                    if (i && (j < pw - 1)) {
                        mb.mbC = this.mbs[mbaddr - pw + 1];
                    } else {
                        mb.mbC = null;
                    }

                    if (i > 0 && j > 0) {
                        mb.mbD = this.mbs[mbaddr - pw - 1];
                    } else {
                        mb.mbD = null;
                    }
                }
            }
        },
        pushData: function(buf) {
            this.buffer.enq(buf);
            this.decode();
        },
        initDpb: function() {
            this.dpb = _dpb.create({
                decoder: this,
                maxRefFrames: _util.max(this.sps.num_ref_frames, 1),
                maxFrameNum: 1 << (this.sps.log2_max_frame_num_minus4 + 4)
            });
        },
        activateParamSets: function(pps_id) {
            if (!this.pps || pps_id !== this.pps.pic_parameter_set_id) {
                this.pps = this.ppses[pps_id];
                if (!this.sps || this.pps.seq_parameter_set_id !== this.sps.seq_parameter_set_id) {
                    this.sps = this.spses[this.pps.seq_parameter_set_id];

                    this.widthInMb = this.sps.pic_width_in_mbs_minus1 + 1;
                    this.heightInMb = this.sps.pic_height_in_map_units_minus1 + 1;
                    this.width = this.widthInMb << 4;
                    this.height = this.heightInMb << 4;
                    this.picSizeInMb = this.widthInMb * this.heightInMb;
                    this.picSize = this.picSizeInMb << 8;
                    this.resetSample();
                    this.initMbs();
                    this.initDpb();
                }
            }
        },

    };

    function create() {
        var decoder = new Decoder();
        return decoder;
    }

    return {
        create: create
    };
});