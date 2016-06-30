/**
 * Created by gd on 16/5/9.
 */
define(['prism/queuebuffer'], function(_queuebuffer) {


    function Pps(buf) {
        this.buf = buf;
        this.dv = new DataView(this.buf);
    }
    
    Pps.prototype = {
        parse: function() {
            var qb = _queuebuffer.create(this.buf);
            this.pic_parameter_set_id = qb.deqUe();
            this.seq_parameter_set_id = qb.deqUe();

            /* entropy_coding_mode_flag, shall be 0 for baseline profile */
            this.entropy_coding_mode_flag = qb.deqBits(1);
            this.pic_order_present_flag = qb.deqBits(1);
            this.num_slice_groups_minus1 = qb.deqUe();

            if (this.num_slice_groups_minus1 > 0) {
                this.slice_group_map_type = qb.deqUe();
                if (this.slice_group_map_type === 0) {
                    this.run_length_minus1 = [];
                    for (var iGroup = 0; iGroup <= this.num_slice_groups_minus1; iGroup++) {
                        this.run_length_minus1[iGroup] = qb.deqUe();
                    }
                } else if (this.slice_group_map_type === 2) {
                    this.top_left = [];
                    this.bottom_right = [];
                    for (var iGroup = 0; iGroup <= this.num_slice_groups_minus1; iGroup++) {
                        this.top_left[iGroup] = qb.deqUe();
                        this.bottom_right[iGroup] = qb.deqUe();
                    }
                } else if (this.slice_group_map_type === 3 || this.slice_group_map_type === 4 || this.slice_group_map_type === 5) {
                    this.slice_group_change_direction_flag = qb.deqBits(1);
                    this.slice_group_change_rate_minus1 = qb.deqUe();
                } else if (this.slice_group_map_type === 6) {
                    this.pic_size_in_map_units_minus1 = qb.deqUe();
                    this.slice_group_id = [];
                    for (var i = 0; i <= this.pic_size_in_map_units_minus1; i++) {
                        var val = this.num_slice_groups_minus1 + 1;
                        /* Ceil(Log2(val)) */
                        var j = 0;
                        while (val >> j)
                            j++;
                        j--;
                        if ((1 << j) < val) {
                            j++;
                        }
                        this.slice_group_id[i] = qb.deqBits(j);
                    }
                }
            }

            this.num_ref_idx_l0_active_minus1 = qb.deqUe();
            this.num_ref_idx_l1_active_minus1 = qb.deqUe();

            /* weighted_pred_flag, this shall be 0 for baseline profile */
            this.weighted_pred_flag = qb.deqBits(1);
            this.weighted_bipred_idc = qb.deqBits(2);
            this.pic_init_qp_minus26 = qb.deqSe();
            this.pic_init_qs_minus26 = qb.deqSe();
            this.chroma_qp_index_offset = qb.deqSe();
            this.deblocking_filter_control_present_flag = qb.deqBits(1);
            this.constrained_intra_pred_flag = qb.deqBits(1);
            this.redundant_pic_cnt_present_flag = qb.deqBits(1);

            // TODO if more_rbsp_data()

            console.log(this);
        }
    };
    
    function create(buf) {
        var pps = new Pps(buf);
        return pps;
    }
    
    return {
        create: create
    };
});