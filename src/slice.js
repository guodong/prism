/**
 * Created by gd on 16/5/10.
 */
define([
    'prism/queuebuffer',
    'prism/defs',
    'prism/common',
    'prism/macroblock_layer',
    'prism/util',
    'prism/dpb'
], function(_queuebuffer, _defs, _common, _macroblock_layer, _util, _dpb) {

    function yuv2canvas(yuv, width, height, canvas) {

        canvas.width = width;
        canvas.height = height;

        context = canvas.getContext("2d");
        output = context.createImageData(width, height);
        outputData = output.data;

        yOffset = 0;
        uOffset = width * height;
        vOffset = width * height + (width * height) / 4;
        for (var h = 0; h < height; h++) {
            for (var w = 0; w < width; w++) {
                ypos = w + h * width + yOffset;

                upos = (w >> 1) + (h >> 1) * width / 2 + uOffset;
                vpos = (w >> 1) + (h >> 1) * width / 2 + vOffset;

                Y = yuv[ypos];
                U = yuv[upos] - 128;
                V = yuv[vpos] - 128;

                R = (Y + 1.371 * V);
                G = (Y - 0.698 * V - 0.336 * U);
                B = (Y + 1.732 * U);
                outputData_pos = w * 4 + width * h * 4;
                outputData[0 + outputData_pos] = R;
                outputData[1 + outputData_pos] = G;
                outputData[2 + outputData_pos] = B;
                outputData[3 + outputData_pos] = 255;
            }
        }

        context.putImageData(output, 0, 0);
    }

    function Slice(buf, decoder) {
        this.buf = buf;
        this.dv = new DataView(this.buf);
        this.qb = _queuebuffer.create(this.buf);
        this.decoder = decoder;
    }
    var can = document.createElement('canvas');
    document.body.appendChild(can);

    Slice.prototype = {
        decodePOC: function(poc) {
            var picOrderCnt;
            var containsMmco5 = false;
            var frameNumOffset;
            var maxPicOrderCntLsb = 1 << (this.decoder.sps.log2_max_pic_order_cnt_lsb_minus4 + 4);
            if (this.adaptive_ref_pic_marking_mode_flag)
            {
                var i = 0;
                while (this.operation[i].memory_management_control_operation)
                {
                    if (this.operation[i].memory_management_control_operation === 5)
                    {
                        containsMmco5 = true;
                        break;
                    }
                    i++;
                }
            }
            switch (this.decoder.sps.pic_order_cnt_type)
            {

                case 0:
                    /* set prevPicOrderCnt values for IDR frame */
                    if (this.nal.nal_unit_type === _defs.NAL_SLICE_IDR)
                    {
                        poc.prevPicOrderCntMsb = 0;
                        poc.prevPicOrderCntLsb = 0;
                    }

                    /* compute picOrderCntMsb (stored in picOrderCnt variable) */
                    if ( (this.pic_order_cnt_lsb < poc.prevPicOrderCntLsb) &&
                        ((poc.prevPicOrderCntLsb - this.pic_order_cnt_lsb) >=
                        maxPicOrderCntLsb/2) )
                    {
                        picOrderCnt = poc.prevPicOrderCntMsb + maxPicOrderCntLsb;
                    }
                    else if ((this.pic_order_cnt_lsb > poc.prevPicOrderCntLsb) &&
                        ((this.pic_order_cnt_lsb - poc.prevPicOrderCntLsb) >
                        maxPicOrderCntLsb/2) )
                    {
                        picOrderCnt = poc.prevPicOrderCntMsb -
                            maxPicOrderCntLsb;
                    }
                    else
                        picOrderCnt = poc.prevPicOrderCntMsb;

                    /* standard specifies that prevPicOrderCntMsb is from previous
                     * rererence frame . replace old value only if current frame is
                     * rererence frame */
                    if (this.nal.nal_ref_idc)
                        poc.prevPicOrderCntMsb = picOrderCnt;

                    /* compute top field order cnt (stored in picOrderCnt) */
                    picOrderCnt += this.pic_order_cnt_lsb;

                    /* if delta for bottom field is negative . bottom will be the
                     * minimum pic order count */
                    if (this.delta_pic_order_cnt_bottom < 0)
                        picOrderCnt += this.delta_pic_order_cnt_bottom;

                    /* standard specifies that prevPicOrderCntLsb is from previous
                     * rererence frame . replace old value only if current frame is
                     * rererence frame */
                    if (this.nal.nal_ref_idc)
                    {
                        /* if current frame contains mmco5 . modify values to be
                         * stored */
                        if (containsMmco5)
                        {
                            poc.prevPicOrderCntMsb = 0;
                            /* prevPicOrderCntLsb should be the top field picOrderCnt
                             * if previous frame included mmco5. Top field picOrderCnt
                             * for frames containing mmco5 is obtained by subtracting
                             * the picOrderCnt from original top field order count .
                             * value is zero if top field was the minimum, i.e. delta
                             * for bottom was positive, otherwise value is
                             * -deltaPicOrderCntBottom */
                            if (this.delta_pic_order_cnt_bottom < 0)
                                poc.prevPicOrderCntLsb =
                                    (-this.delta_pic_order_cnt_bottom);
                            else
                                poc.prevPicOrderCntLsb = 0;
                            picOrderCnt = 0;
                        }
                        else
                        {
                            poc.prevPicOrderCntLsb = this.pic_order_cnt_lsb;
                        }
                    }

                    break;

                case 1:
                    console.log("poc 1, FF!!");
                    /* step 1 (in the description in the standard) */
                    // if (IS_IDR_NAL_UNIT(pNalUnit))
                    //     frameNumOffset = 0;
                    // else if (poc.prevFrameNum > pSliceHeader.frameNum)
                    //     frameNumOffset = poc.prevFrameNumOffset + sps.maxFrameNum;
                    // else
                    //     frameNumOffset = poc.prevFrameNumOffset;
                    //
                    // /* step 2 */
                    // if (sps.numRefFramesInPicOrderCntCycle)
                    //     absFrameNum = frameNumOffset + pSliceHeader.frameNum;
                    // else
                    //     absFrameNum = 0;
                    //
                    // if (pNalUnit.nalRefIdc == 0 && absFrameNum > 0)
                    //     absFrameNum -= 1;
                    //
                    // /* step 3 */
                    // if (absFrameNum > 0)
                    // {
                    //     picOrderCntCycleCnt =
                    //         (absFrameNum - 1)/sps.numRefFramesInPicOrderCntCycle;
                    //     frameNumInPicOrderCntCycle =
                    //         (absFrameNum - 1)%sps.numRefFramesInPicOrderCntCycle;
                    // }
                    //
                    // /* step 4 */
                    // expectedDeltaPicOrderCntCycle = 0;
                    // for (i = 0; i < sps.numRefFramesInPicOrderCntCycle; i++)
                    //     expectedDeltaPicOrderCntCycle += sps.offsetForRefFrame[i];
                    //
                    // /* step 5 (picOrderCnt used to store expectedPicOrderCnt) */
                    // /*lint -esym(644,picOrderCntCycleCnt) always initialized */
                    // /*lint -esym(644,frameNumInPicOrderCntCycle) always initialized */
                    // if (absFrameNum > 0)
                    // {
                    //     picOrderCnt =
                    //         (i32)picOrderCntCycleCnt * expectedDeltaPicOrderCntCycle;
                    //     for (i = 0; i <= frameNumInPicOrderCntCycle; i++)
                    //         picOrderCnt += sps.offsetForRefFrame[i];
                    // }
                    // else
                    //     picOrderCnt = 0;
                    //
                    // if (pNalUnit.nalRefIdc == 0)
                    //     picOrderCnt += sps.offsetForNonRefPic;
                    //
                    // /* step 6 (picOrderCnt is top field order cnt if delta for bottom
                    //  * is positive, otherwise it is bottom field order cnt) */
                    // picOrderCnt += pSliceHeader.deltaPicOrderCnt[0];
                    //
                    // if ( (sps.offsetForTopToBottomField +
                    //     pSliceHeader.deltaPicOrderCnt[1]) < 0 )
                    // {
                    //     picOrderCnt += sps.offsetForTopToBottomField +
                    //         pSliceHeader.deltaPicOrderCnt[1];
                    // }
                    //
                    // /* if current picture contains mmco5 . set prevFrameNumOffset and
                    //  * prevFrameNum to 0 for computation of picOrderCnt of next
                    //  * frame, otherwise store frameNum and frameNumOffset to poc
                    //  * structure */
                    // if (!containsMmco5)
                    // {
                    //     poc.prevFrameNumOffset = frameNumOffset;
                    //     poc.prevFrameNum = pSliceHeader.frameNum;
                    // }
                    // else
                    // {
                    //     poc.prevFrameNumOffset = 0;
                    //     poc.prevFrameNum = 0;
                    //     picOrderCnt = 0;
                    // }
                    break;

                default: /* case 2 */
                    var maxFrameNum = 1 << (this.decoder.sps.log2_max_frame_num_minus4 + 4);
                    /* derive frameNumOffset */
                    if (this.nal.nal_unit_type === _defs.NAL_SLICE_IDR)
                        frameNumOffset = 0;
                    else if (poc.prevFrameNum > this.frame_num)
                        frameNumOffset = poc.prevFrameNumOffset + maxFrameNum;
                    else
                        frameNumOffset = poc.prevFrameNumOffset;

                    /* derive picOrderCnt (type 2 has same value for top and bottom
                     * field order cnts) */
                    if (this.nal.nal_unit_type === _defs.NAL_SLICE_IDR)
                        picOrderCnt = 0;
                    else if (this.nal.nal_ref_idc === 0)
                        picOrderCnt =
                            2 * (frameNumOffset + this.frame_num) - 1;
                    else
                        picOrderCnt =
                            2 * (frameNumOffset + this.frame_num);

                    /* if current picture contains mmco5 . set prevFrameNumOffset and
                     * prevFrameNum to 0 for computation of picOrderCnt of next
                     * frame, otherwise store frameNum and frameNumOffset to poc
                     * structure */
                    if (!containsMmco5)
                    {
                        poc.prevFrameNumOffset = frameNumOffset;
                        poc.prevFrameNum = this.frame_num;
                    }
                    else
                    {
                        poc.prevFrameNumOffset = 0;
                        poc.prevFrameNum = 0;
                        picOrderCnt = 0;
                    }
                    break;

            }

            return picOrderCnt;
        },
        parse: function() {
            var qb = this.qb;
            /* slice_header() */
            this.first_mb_in_slice = qb.deqUe();
            this.slice_type = qb.deqUe();
            this.pic_parameter_set_id = qb.deqUe();
            
            /* active pps and sps */
            this.decoder.activateParamSets(this.pic_parameter_set_id);

            this.frame_num = qb.deqBits(this.nal.decoder.sps.log2_max_frame_num_minus4 + 4);

            if (this.nal.nal_unit_type === 5) {
                this.idr_pic_id = qb.deqUe();
            }

            if (this.nal.decoder.sps.pic_order_cnt_type === 0) {
                this.pic_order_cnt_lsb = qb.deqBits(this.nal.decoder.sps.log2_max_pic_order_cnt_lsb_minus4 + 4);
                if (this.nal.decoder.pps.pic_order_present_flag && !this.field_pic_flag) {
                    this.delta_pic_order_cnt_bottom = qb.deqSe();
                }
            }

            if (this.nal.decoder.sps.pic_order_cnt_type === 1 && !this.nal.decoder.sps.delta_pic_order_always_zero_flag) {
                this.delta_pic_order_cnt = [qb.deqSe()];
                if (this.nal.decoder.pps.pic_order_present_flag && !this.field_pic_flag) {
                    this.delta_pic_order_cnt[1] = qb.deqSe();
                }
            }

            if (this.nal.decoder.pps.redundant_pic_cnt_present_flag) {
                this.redundant_pic_cnt = qb.deqUe();
            }

            if (_common.isPSlice(this.slice_type)) {
                this.num_ref_idx_active_override_flag = qb.deqBits(1);
                if (this.num_ref_idx_active_override_flag) {
                    this.num_ref_idx_l0_active_minus1 = qb.deqUe();
                } else { /* set num_ref_idx_l0_active_minus1 from pic param set */
                    this.num_ref_idx_l0_active_minus1 = this.nal.decoder.pps.num_ref_idx_l0_active_minus1;
                }
            }

            /* ref_pic_list_reordering() */
            if (!_common.isISlice(this.slice_type)) {
                this.ref_pic_list_reordering_flag_l0 = qb.deqBits(1);
                if (this.ref_pic_list_reordering_flag_l0) {
                    this.ref_pic_list_reordering = [];
                    var i = 0;
                    do {
                        this.ref_pic_list_reordering[i] = {};
                        this.ref_pic_list_reordering[i].reordering_of_pic_nums_idc = qb.deqUe();
                        if (this.reordering_of_pic_nums_idc === 0 || this.reordering_of_pic_nums_idc === 1) {
                            this.ref_pic_list_reordering[i].abs_diff_pic_num_minus1 = qb.deqUe();
                        } else if (this.reordering_of_pic_nums_idc === 2) {
                            this.ref_pic_list_reordering[i].long_term_pic_num = qb.deqUe();
                        }
                    } while (this.reordering_of_pic_nums_idc !== 3);
                }
            }
            /* ref_pic_list_reordering() end */

            /* FF: weighted_pred_flag, this shall be 0 for baseline profile */

            if (this.nal.nal_ref_idc !== 0) {
                /* dec_ref_pic_marking() */
                if (this.nal.nal_unit_type === 5) {
                    this.no_output_of_prior_pics_flag = qb.deqBits(1);
                    this.long_term_reference_flag = qb.deqBits(1);
                } else {
                    this.adaptive_ref_pic_marking_mode_flag = qb.deqBits(1);
                    if (this.adaptive_ref_pic_marking_mode_flag) {
                        this.operation = [];
                        var i = 0;
                        do {
                            this.operation[i] = {};
                            this.operation[i].memory_management_control_operation = qb.deqUe();
                            if (this.operation[i].memory_management_control_operation === 1 || this.operation[i].memory_management_control_operation === 3) {
                                this.operation[i].difference_of_pic_nums_minus1 = qb.deqUe();
                            }
                            if (this.operation[i].memory_management_control_operation === 2) {
                                this.operation[i].long_term_pic_num = qb.deqUe();
                            }
                            if (this.operation[i].memory_management_control_operation === 3 || this.operation[i].memory_management_control_operation === 6) {
                                this.operation[i].long_term_frame_idx = qb.deqUe();
                            }
                            if (this.operation[i].memory_management_control_operation === 4) {
                                this.operation[i].max_long_term_frame_idx_plus1 = qb.deqUe();
                            }
                            i++;
                        } while (this.operation[i].memory_management_control_operation !== 0);
                    }
                }
                /* dec_ref_pic_marking() end */
            }

            this.slice_qp_delta = qb.deqSe();

            if (this.nal.decoder.pps.deblocking_filter_control_present_flag) {
                this.disable_deblocking_filter_idc = qb.deqUe();
                if (this.disable_deblocking_filter_idc !== 1) {
                    this.slice_alpha_c0_offset_div2 = qb.deqSe();
                    this.slice_beta_offset_div2 = qb.deqSe();
                }
            } else {
                this.disable_deblocking_filter_idc = 0;
            }

            if (this.nal.decoder.pps.num_slice_groups_minus1 > 0 && this.nal.decoder.pps.slice_group_map_type >= 3 && this.nal.decoder.pps.slice_group_map_type <= 5) {
                var PicWidthInMbs = this.nal.decoder.sps.pic_width_in_mbs_minus1 + 1;
                var PicHeightInMapUnits = this.nal.decoder.sps.pic_height_in_map_units_minus1 + 1;
                var PicSizeInMapUnits = PicWidthInMbs * PicHeightInMapUnits;

                var SliceGroupChangeRate = this.nal.decoder.pps.slice_group_change_rate_minus1 + 1;
                var val = PicSizeInMapUnits / SliceGroupChangeRate + 1;

                /* Ceil(Log2(val)) */
                var j = 0;
                while (val >> j)
                    j++;
                j--;
                if ((1 << j) < val) {
                    j++;
                }

                this.slice_group_change_cycle = qb.deqBits(j);
            }

            /* slice_header() end*/
            this.decoder.dpb.initRefPicList();
            if (this.ref_pic_list_reordering_flag_l0) {
                this.decoder.dpb.reorderRefPicList(this);
            }


            /* slice_data() */
            //var MbaffFrameFlag = this.nal.decoder.sps.mb_adaptive_frame_field_flag && !this.field_pic_flag;
            this.MbaffFrameFlag = 0;
            var MbaffFrameFlag = this.MbaffFrameFlag;
            var CurrMbAddr = this.first_mb_in_slice * (1 + MbaffFrameFlag);
            var moreDataFlag = 1;
            var prevMbSkipped = 0;
            var self = this;
            var NextMbAddress = function(n) { /* could be optimized */
                return n + 1;
                /* for test */
                // var FrameHeightInMbs = (2 - self.nal.decoder.sps.frame_mbs_only_flag) * PicHeightInMapUnits;
                // var PicHeightInMbs = FrameHeightInMbs / ( 1 + self.field_pic_flag );
                // var PicSizeInMbs = PicWidthInMbs * PicHeightInMbs;
                // var MbToSliceGroupMap = [];
                // var mapUnitToSliceGroupMap = [];
                // for (var i = 0; i < PicSizeInMapUnits; i++) {
                //     mapUnitToSliceGroupMap[i] = self.nal.decoder.pps.slice_group_id[i];
                // }
                // if (self.nal.decoder.sps.frame_mbs_only_flag === 1 || self.field_pic_flag === 1) {
                //     MbToSliceGroupMap = mapUnitToSliceGroupMap;
                // } else if (MbaffFrameFlag === 1) {
                //     for (var i in mapUnitToSliceGroupMap) {
                //         MbToSliceGroupMap[i] = mapUnitToSliceGroupMap[Math.floor(i / 2)];
                //     }
                // } else {
                //     for (var i in mapUnitToSliceGroupMap) {
                //         MbToSliceGroupMap[i] = mapUnitToSliceGroupMap[(Math.floow(i/(2*PicWidthInMbs))) * PicWidthInMbs + (i % PicWidthInMbs)];
                //     }
                // }
                // var i = n + 1;
                // while (i < PicSizeInMbs && (MbToSliceGroupMap[i] != MbToSliceGroupMap[n])) {
                //     i++;
                // }
                // return i;
            };

            do {
                if (!_common.isISlice(this.slice_type) && (this.slice_type % 5 !== 4)) {
                    if (!this.nal.decoder.pps.entropy_coding_mode_flag) {
                        this.mb_skip_run = qb.deqUe();
                        prevMbSkipped = (this.mb_skip_run > 0);
                        for (var i = 0; i < this.mb_skip_run; i++) {
                            var mb = this.decoder.mbs[CurrMbAddr];
                            if (!mb) {
                                console.log(CurrMbAddr);
                            }
                            this.decoder.currMb = mb;
                            mb.slice = this;
                            mb.mb_type = _defs.P_Skip;
                            mb.type = _defs.P_MB;
                            for (var j = 0; j < mb.totalCoeff.length; j++) {
                                mb.totalCoeff[j] = 0;
                            }
                            for (var j = 0; j < mb.prev_intra4x4_pred_mode_flag.length; j++) {
                                mb.prev_intra4x4_pred_mode_flag[j] = 0;
                            }
                            for (var j = 0; j < mb.rem_intra4x4_pred_mode.length; j++) {
                                mb.rem_intra4x4_pred_mode[j] = 0;
                            }
                            for (var j in mb.LumaLevel) {
                                for (var k in mb.LumaLevel[j]) {
                                    mb.LumaLevel[j][k] = 0;
                                }
                            }
                            for (var j in mb.ChromaDCLevel) {
                                for (var k in mb.ChromaDCLevel[j]) {
                                    mb.ChromaDCLevel[j][k] = 0;
                                }
                            }
                            for (var j in mb.ChromaACLevel) {
                                for (var k in mb.ChromaACLevel[j]) {
                                    for (var m in mb.ChromaACLevel[j][k]) {
                                        mb.ChromaACLevel[j][k][m] = 0;
                                    }
                                }
                            }
                            mb.numMbPart = 1;
                            mb.numSubMbPart = 1;
                            mb.sub_mb_type[0] = _defs.NA;
                            mb.mbPartWidth = 16;
                            mb.mbPartHeight = 16;
                            mb.hasResidual = false;
                            mb.CodedBlockPattenLuma = 0;
                            mb.mb_qp_delta = 0;
                            
                            mb.decode();
                            CurrMbAddr = NextMbAddress(CurrMbAddr);
                        }
                        moreDataFlag = qb.more_rbsp_data();
                    } else {
                        // FF
                    }
                }

                if (moreDataFlag) {
                    /* macroblock_layer() */
                    var mb = this.decoder.mbs[CurrMbAddr];
                    this.decoder.currMb = mb;
                    mb.slice = this;
                    for (var j = 0; j < mb.totalCoeff.length; j++) {
                        mb.totalCoeff[j] = 0;
                    }
                    for (var j = 0; j < mb.prev_intra4x4_pred_mode_flag.length; j++) {
                        mb.prev_intra4x4_pred_mode_flag[j] = 0;
                    }
                    for (var j = 0; j < mb.rem_intra4x4_pred_mode.length; j++) {
                        mb.rem_intra4x4_pred_mode[j] = 0;
                    }
                    mb.hasResidual = false;

                    /* parse bit stream */
                    mb.parse(this.qb);

                    mb.decode();

                    /* macroblock_layer() end */
                }
                moreDataFlag = qb.more_rbsp_data();
                CurrMbAddr = NextMbAddress(CurrMbAddr);
            } while (moreDataFlag);
        }
    };


    function create(buf, decoder) {
        var slice = new Slice(buf, decoder);
        return slice;
    }

    return {
        create: create
    };
});