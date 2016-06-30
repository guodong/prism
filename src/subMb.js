/**
 * Created by gd on 16/6/10.
 */
define([
    'prism/defs'
], function(_defs) {
    function subMb() {
        this.numSubMbPart = 1;
    }
    
    subMb.prototype = {
        setSubMbType: function(sub_mb_type) {
            this.sub_mb_type = sub_mb_type;
            switch (sub_mb_type) {
                case _defs.P_L0_8x8:
                    this.numSubMbPart = 1;
                    this.subMbPartWidth = 8;
                    this.subMbPartHeight = 8;
                    break;
                case _defs.P_L0_4x4:
                    this.numSubMbPart = 4;
                    this.subMbPartWidth = 4;
                    this.subMbPartHeight = 4;
                    break;
                case _defs.P_L0_8x4:
                    this.numSubMbPart = 2;
                    this.subMbPartWidth = 8;
                    this.subMbPartHeight = 4;
                    break;
                default:
                    this.numSubMbPart = 2;
                    this.subMbPartWidth = 4;
                    this.subMbPartHeight = 8;
                    break;
            }
        }
    };
    
    function create(opts) {
        var smb = new subMb();
        for (var i in opts) {
            smb[i] = opts[i];
        }
        return smb;
    }
    
    return {
        create: create
    };
});