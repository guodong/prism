/**
 * Created by gd on 16/6/11.
 */
define([
    'prism/defs',
    'prism/util'
], function(_defs, _util) {
    function Dpb() {
        this.noReordering = true;
        /* overwrite on read sps */
        this.maxRefFrames = 0;
        this.maxFrameNum = 0;
    }

    Dpb.prototype = {
        init: function() {
            this.images = new Array(16);
            for (var i = 0; i < 16; i++) {
                this.images[i] = {
                    data: new Array(this.decoder.picSizeInMb * 384),
                    status: _defs.UNUSED
                };
            }
            this.outBuf = new Array(16);
            for (var i = 0; i < 16; i++) {
                this.outBuf[i] = {};
            }
            this.refPicList0 = this.images;
            this.dpbSize = this.maxRefFrames;
            this.maxLongTermFrameIdx = 0xFFFF;
            this.fullness = 0;
            this.numRefFrames = 0;
            this.prevRefFrameNum = 0;
            this.numOut = 0;
            this.outIndex = 0;
        },
        findSmallestPicOrderCnt: function() {
            var i;
            var picOrderCnt;
            var tmp = null;

            picOrderCnt = 0x7FFFFFFF;

            for (i = 0; i <= this.dpbSize; i++) {
                if (this.refPicList0[i].toBeDisplayed &&
                    (this.refPicList0[i].picOrderCnt < picOrderCnt)) {
                    tmp = this.refPicList0[i];
                    picOrderCnt = this.refPicList0[i].picOrderCnt;
                }
            }

            return tmp;
        },
        outputPicture: function() {
            if (this.noReordering)
                return 1;

            //tmp = this.findSmallestPicOrderCnt();

            /* no pictures to be displayed */
            // if (tmp === null)
            //     return 1;
            //
            // dpb->outBuf[dpb->numOut].data  = tmp->data;
            // dpb->outBuf[dpb->numOut].isIdr = tmp->isIdr;
            // dpb->outBuf[dpb->numOut].picId = tmp->picId;
            // dpb->outBuf[dpb->numOut].numErrMbs = tmp->numErrMbs;
            // dpb->numOut++;
            //
            // tmp->toBeDisplayed = HANTRO_FALSE;
            // if (!IS_REFERENCE(*tmp))
            // {
            //     dpb->fullness--;
            // }
        },
        findDpbPic: function(picNum, isShortTerm) {
            var i = 0;
            var found = false;

            /* Code */

            if (isShortTerm) {
                while (i < this.maxRefFrames && !found) {
                    if ((this.refPicList0[i].status === _defs.NON_EXIST || this.refPicList0[i].status === _defs.SHORT_TERM) &&
                        this.refPicList0[i].picNum == picNum)
                        found = true;
                    else
                        i++;
                }
            }
            else {
                while (i < this.maxRefFrames && !found) {
                    if (this.refPicList0[i].status === _defs.LONG_TERM &&
                        this.refPicList0[i].picNum == picNum)
                        found = true;
                    else
                        i++;
                }
            }

            if (found)
                return i;
            else
                return -1;
        },
        mmcop1: function(currPicNum, differenceOfPicNums) {
            var index, picNum;

            picNum = currPicNum - differenceOfPicNums;

            index = this.findDpbPic(picNum, true);
            if (index < 0)
                return (1);

            this.refPicList0[index] = _defs.UNUSED;
            this.numRefFrames--;
            if (!this.refPicList0[index].toBeDisplayed)
                this.fullness--;

            return 0;
        },
        mmcop2: function(longTermPicNum) {
            var index;

            index = this.findDpbPic(longTermPicNum, false);
            if (index < 0)
                return 1;

            this.refPicList0[index] = _defs.UNUSED;
            this.numRefFrames--;
            if (!this.refPicList0[index].toBeDisplayed)
                this.fullness--;

            return 0;
        },
        mmcop3: function(currPicNum, differenceOfPicNums, longTermFrameIdx) {
            var index, picNum, i;

            if ((this.maxLongTermFrameIdx == 0xFFFF) ||
                (longTermFrameIdx > this.maxLongTermFrameIdx))
                return 1;

            /* check if a long term picture with the same longTermFrameIdx already
             * exist and remove it if necessary */
            for (i = 0; i < this.maxRefFrames; i++)
                if (this.refPicList0[i].status === _defs.LONG_TERM &&
                    this.refPicList0[i].picNum == longTermFrameIdx) {
                    this.refPicList0[i] = _defs.UNUSED;
                    this.numRefFrames--;
                    if (!this.refPicList0[i].toBeDisplayed)
                        this.fullness--;
                    break;
                }

            picNum = currPicNum - differenceOfPicNums;

            index = this.findDpbPic(picNum, true);
            if (index < 0)
                return 1;
            if (this.refPicList0[i].status <= _defs.NON_EXIST)
                return 1;

            this.refPicList0[index].status = _defs.LONG_TERM;
            this.refPicList0[index].picNum = longTermFrameIdx;

            return 0;
        },
        mmcop4: function(maxLongTermFrameIdx) {
            this.maxLongTermFrameIdx = maxLongTermFrameIdx;

            for (var i = 0; i < this.maxRefFrames; i++)
                if (this.refPicList0[i] === _defs.LONG_TERM &&
                    ( (this.refPicList0[i].picNum > maxLongTermFrameIdx) ||
                    (this.maxLongTermFrameIdx == 0xFFFF) )) {
                    this.refPicList0[i] = _defs.UNUSED;
                    this.numRefFrames--;
                    if (!this.refPicList0[i].toBeDisplayed)
                        this.fullness--;
                }

            return 0;
        },
        mmcop5: function() {
            for (var i = 0; i < 16; i++) {
                for (var i = 0; i < 16; i++) {
                    this.refPicList0[i] = {
                        data: new Array(this.decoder.picSizeInMb * 384),
                        status: _defs.UNUSED
                    };
                    if (!this.refPicList0[i].toBeDisplayed)
                        this.fullness--;
                }
            }

            /* output all pictures */
            while (this.outputPicture() === 0);
            this.numRefFrames = 0;
            this.maxLongTermFrameIdx = 0xFFFF;
            this.prevRefFrameNum = 0;
        },
        mmcop6: function(frameNum, picOrderCnt, longTermFrameIdx) {
            if ((this.maxLongTermFrameIdx == 0xFFFF) ||
                (longTermFrameIdx > this.maxLongTermFrameIdx))
                return 1;

            /* check if a long term picture with the same longTermFrameIdx already
             * exist and remove it if necessary */
            for (var i = 0; i < this.maxRefFrames; i++)
                if (this.refPicList0[i].status === _defs.LONG_TERM &&
                    this.refPicList0[i].picNum == longTermFrameIdx) {
                    this.refPicList0[i] = _defs.UNUSED;
                    this.numRefFrames--;
                    if (!this.refPicList0[i].toBeDisplayed)
                        this.fullness--;
                    break;
                }

            if (this.numRefFrames < this.maxRefFrames) {
                this.currentOut.frameNum = frameNum;
                this.currentOut.picNum = longTermFrameIdx;
                this.currentOut.picOrderCnt = picOrderCnt;
                this.currentOut.status = _defs.LONG_TERM;
                if (this.noReordering)
                    this.currentOut.toBeDisplayed = false;
                else
                    this.currentOut.toBeDisplayed = true;
                this.numRefFrames++;
                this.fullness++;
                return 0;
            }
            /* if there is no room, return an error */
            else
                return 1;
        },
        slidingWindowRefPicMarking: function() {
            var index, picNum;
            var i;

            if (this.numRefFrames < this.maxRefFrames) {
                return 0;
            }
            else {
                index = -1;
                picNum = 0;
                /* find the oldest short term picture */
                for (i = 0; i < this.numRefFrames; i++)
                    if (this.refPicList0[i].status === _defs.NON_EXIST || this.refPicList0[i].status === _defs.SHORT_TERM)
                        if (this.refPicList0[i].picNum < picNum || index == -1) {
                            index = i;
                            picNum = this.refPicList0[i].picNum;
                        }
                if (index >= 0) {
                    this.refPicList0[i].status = _defs.UNUSED;
                    this.numRefFrames--;
                    if (!this.refPicList0[index].toBeDisplayed)
                        this.fullness--;

                    return 0;
                }
            }

            return 1;
        },
        comparePictures: function(ptr1, ptr2) {
            var pic1, pic2;

            pic1 = ptr1;
            pic2 = ptr2;

            /* both are non-reference pictures, check if needed for display */
            if (!pic1.status && !pic2.status) {
                if (pic1.toBeDisplayed && !pic2.toBeDisplayed)
                    return (-1);
                else if (!pic1.toBeDisplayed && pic2.toBeDisplayed)
                    return (1);
                else
                    return (0);
            }
            /* only pic 1 needed for reference -> greater */
            else if (!pic2.status)
                return (-1);
            /* only pic 2 needed for reference -> greater */
            else if (!pic1.status)
                return (1);
            /* both are short term reference pictures -> check picNum */
            else if ((pic1.status === _defs.NON_EXIST || pic1.status === _defs.SHORT_TERM) && (pic2.status === _defs.NON_EXIST || pic2.status === _defs.SHORT_TERM)) {
                if (pic1.picNum > pic2.picNum)
                    return (-1);
                else if (pic1.picNum < pic2.picNum)
                    return (1);
                else
                    return (0);
            }
            /* only pic 1 is short term -> greater */
            else if ((pic1.status === _defs.NON_EXIST || pic1.status === _defs.SHORT_TERM))
                return (-1);
            /* only pic 2 is short term -> greater */
            else if ((pic2.status === _defs.NON_EXIST || pic2.status === _defs.SHORT_TERM))
                return (1);
            /* both are long term reference pictures -> check picNum (contains the
             * longTermPicNum */
            else {
                if (pic1.picNum > pic2.picNum)
                    return (1);
                else if (pic1.picNum < pic2.picNum)
                    return (-1);
                else
                    return (0);
            }
        },
        sortPic: function() {
            var step;
            var tmpPic;
            var pPic = this.refPicList0;

            step = 7;

            while (step) {
                for (var i = step; i < 17; i++) {
                    tmpPic = pPic[i];
                    var j = i;
                    while (j >= step && this.comparePictures(pPic + j - step, tmpPic) > 0) {
                        pPic[j] = pPic[j - step];
                        j -= step;
                    }
                    pPic[j] = tmpPic;
                }
                step >>= 1;
            }
        },
        markDecRefPic: function(slice, isIdr, frameNum, picOrderCnt) {
            var i, status;
            var markedAsLongTerm;
            var toBeDisplayed;
            var image = {data: []};
            for (var x = 0; x < this.decoder.width; x++) {
                image.data[x] = [];
                for (var y = 0; y < this.decoder.height; y++) {
                    image.data[x][y] = this.decoder.SL[x][y];
                }
            }
            var dpb = this;
            dpb.currentOut = image;

            dpb.lastContainsMmco5 = false;
            status = 0;

            toBeDisplayed = dpb.noReordering ? false : true;

            /* non-reference picture, stored for display reordering purposes */
            if (!slice.nal.nal_ref_idc) {
                dpb.currentOut.status = _defs.UNUSED;
                dpb.currentOut.frameNum = frameNum;
                dpb.currentOut.picNum = frameNum;
                dpb.currentOut.picOrderCnt = picOrderCnt;
                dpb.currentOut.toBeDisplayed = toBeDisplayed;
                if (!dpb.noReordering)
                    dpb.fullness++;
            }
            /* IDR picture */
            else if (isIdr) {

                /* CheckGapsInFrameNum not called for IDR pictures . have to
                 * reset numOut and outIndex here */
                dpb.numOut = dpb.outIndex = 0;

                /* flush the buffer */
                this.mmcop5();
                /* if noOutputOfPriorPicsFlag was set . the pictures preceding the
                 * IDR picture shall not be output . set output buffer empty */
                if (slice.no_output_of_prior_pics_flag || this.noReordering) {
                    dpb.numOut = 0;
                    dpb.outIndex = 0;
                }

                if (slice.long_term_reference_flag) {
                    dpb.currentOut.status = _defs.LONG_TERM;
                    dpb.maxLongTermFrameIdx = 0;
                }
                else {
                    dpb.currentOut.status = _defs.SHORT_TERM;
                    dpb.maxLongTermFrameIdx = 0xFFFF;
                }
                dpb.currentOut.frameNum = 0;
                dpb.currentOut.picNum = 0;
                dpb.currentOut.picOrderCnt = 0;
                dpb.currentOut.toBeDisplayed = toBeDisplayed;
                dpb.fullness = 1;
                dpb.numRefFrames = 1;
            }
            /* reference picture */
            else {
                markedAsLongTerm = false;
                if (slice.adaptive_ref_pic_marking_mode_flag) {
                    i = 0;
                    while (slice.operation[i].memory_management_control_operation) {
                        switch (slice.operation[i].memory_management_control_operation) {
                            case 1:
                                status = this.mmcop1(
                                    frameNum,
                                    slice.operation[i].difference_of_pic_nums_minus1 + 1);
                                break;

                            case 2:
                                status = this.mmcop2(slice.operation[i].long_term_pic_num);
                                break;

                            case 3:
                                status = this.mmcop3(
                                    frameNum,
                                    slice.operation[i].difference_of_pic_nums_minus1 + 1,
                                    slice.operation[i].long_term_frame_idx);
                                break;

                            case 4:
                                status = this.mmcop4(
                                    slice.operation[i].max_long_term_frame_idx_plus1 - 1);
                                break;

                            case 5:
                                status = this.mmcop5();
                                this.lastContainsMmco5 = true;
                                frameNum = 0;
                                break;

                            case 6:
                                status = this.mmcop6(
                                    frameNum,
                                    picOrderCnt,
                                    slice.operation[i].long_term_frame_idx);
                                if (status === 0)
                                    markedAsLongTerm = true;
                                break;

                            default: /* invalid memory management control operation */
                                status = 1;
                                break;
                        }
                        if (status !== 0) {
                            break;
                        }
                        i++;
                    }
                }
                else {
                    status = this.slidingWindowRefPicMarking();
                }
                /* if current picture was not marked as long-term reference by
                 * memory management control operation 6 . mark current as short
                 * term and insert it into dpb (if there is room) */
                if (!markedAsLongTerm) {
                    if (dpb.numRefFrames < dpb.maxRefFrames) {
                        dpb.currentOut.frameNum = frameNum;
                        dpb.currentOut.picNum = frameNum;
                        dpb.currentOut.picOrderCnt = picOrderCnt;
                        dpb.currentOut.status = _defs.SHORT_TERM;
                        dpb.currentOut.toBeDisplayed = toBeDisplayed;
                        dpb.fullness++;
                        dpb.numRefFrames++;
                    }
                    /* no room */
                    else {
                        status = 1;
                    }
                }
            }

            dpb.currentOut.isIdr = isIdr;
            dpb.currentOut.picId = 0;

            /* dpb was initialized to not to reorder the pictures . output current
             * picture immediately */
            if (dpb.noReordering) {
                // dpb.outBuf[dpb.numOut].data  = dpb.currentOut.data;
                // dpb.outBuf[dpb.numOut].isIdr = dpb.currentOut.isIdr;
                // dpb.outBuf[dpb.numOut].picId = dpb.currentOut.picId;
                // dpb.numOut++;
            }
            else {
                /* output pictures if buffer full */
                while (dpb.fullness > dpb.dpbSize) {
                    this.outputPicture();
                }
            }

            /* sort dpb */
            this.refPicList0[16] = image;
            this.sortPic();

            return (status);
        },
        initRefPicList: function() {

        },
        findPic: function(picNum, isShortTerm) {
            var i = 0,
                found = false,
                type = isShortTerm ? _defs.SHORT_TERM : _defs.LONG_TERM;
            while (i < this.maxRefFrames && !found) {
                if (this.images[i].status === type && this.images[i].picNum === picNum) {
                    found = true;
                } else {
                    i++;
                }
            }
            if (found) {
                return i;
            }
            return -1;
        },
        reorderRefPicList: function(slice) {
            var order = slice.ref_pic_list_reordering,
                frameNum = slice.frame_num;
            var i = 0;
            var picNumNoWrap;
            var picNumPred;
            var picNum;
            var isShortTerm;
            var refIdxL0 = 0;
            picNumPred = slice.frame_num;

            while (order[i].reordering_of_pic_nums_idc < 3) {
                if (order[i].reordering_of_pic_nums_idc < 2) {
                    if (order[i].reordering_of_pic_nums_idc === 0) {
                        picNumNoWrap = picNumPred - (order[i].abs_diff_pic_num_minus1 + 1);
                        if (picNumNoWrap < 0) {
                            picNumNoWrap += this.maxFrameNum;
                        }
                    } else {
                        picNumNoWrap = picNumPred + (order[i].abs_diff_pic_num_minus1 + 1);
                        if (picNumNoWrap >= this.maxFrameNum) {
                            picNumNoWrap -= this.maxFrameNum;
                        }
                    }
                    picNumPred = picNumNoWrap;
                    picNum = picNumNoWrap;
                    if (picNumNoWrap > frameNum) {
                        picNum -= this.maxFrameNum;
                    }
                    isShortTerm = true;
                } else {
                    picNum = order[i].long_term_pic_num;
                    isShortTerm = false;
                }

                var index = this.findPic(picNum, isShortTerm);
                if (index < 0) {
                    return -1;
                }
                /* move list to right one position */
                for (var cIdx = slice.num_ref_idx_l0_active_minus1 + 1; cIdx > refIdxL0; cIdx--) {
                    this.refPicList0[cIdx] = this.refPicList0[cIdx - 1];
                }
                /* insert target pic to refIdxL0 */
                this.refPicList0[refIdxL0++] = this.refPicList0[index];
                var nIdx = refIdxL0;
                /* remove inserted pic after refIdxL0 */
                for (var cIdx = refIdxL0; cIdx <= slice.num_ref_idx_l0_active_minus1 + 1; cIdx++) {
                    if (this.refPicList0[cIdx] !== this.refPicList0[index]) {
                        this.refPicList0[nIdx++] = this.refPicList0[cIdx];
                    }
                }
                i++;
            }

        }
    };

    function create(opts) {
        var dpb = new Dpb();
        for (var i in opts) {
            dpb[i] = opts[i];
        }
        dpb.init();
        return dpb;
    }

    return {
        create: create
    };
});