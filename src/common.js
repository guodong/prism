/**
 * Created by gd on 16/5/12.
 */
define([
    'prism/defs'
], function(_defs) {
    function isISlice(type) {
        return (type % 5 === _defs.I_SLICE);
    }
    
    function isPSlice(type) {
        return (type % 5 === _defs.P_SLICE);
    }
    
    function getNeighbourA4x4(blockIndex) {
        return _defs.NA_MAP[blockIndex];
    }
    
    function getNeighbourB4x4(blockIndex) {
        return _defs.NB_MAP[blockIndex];
    }

    function getNeighbourC4x4(blockIndex) {
        return _defs.NC_MAP[blockIndex];
    }

    function getNeighbourD4x4(blockIndex) {
        return _defs.ND_MAP[blockIndex];
    }

    function LevelScale(m, i, j) {
        var v = [
            [10, 16, 13],
            [11, 18, 14],
            [13, 20, 16],
            [14, 23, 18],
            [16, 25, 20],
            [18, 29, 23]
        ];

        if ((i === 0 && j === 0) || (i === 0 && j === 2) || (i === 2 && j === 0) || (i === 2 && j === 2)) {
            return v[m][0];
        } else if ((i === 1 && j === 1) || (i === 1 && j === 3) || (i === 3 && j === 1) || (i === 3 && j === 3)) {
            return v[m][1];
        } else {
            return v[m][2];
        }
    }

    /**
     * inverse scan macroblock
     * @param a mbPartIdx
     * @param b mbPartWidth
     * @param c mbPartHeight
     * @param d mbSampleHeight
     * @param e 0 for x, 1 for y
     * @returns {number}
     */
    function inverseRasterScan(a, b, c, d, e) {
        if (e === 0) {
            return (a % Math.floor(d / b)) * b;
        } else {
            return Math.floor(a / Math.floor(d / b)) * c;
        }
    }
    
    function medianFilter(a, b, c) {
        var max = a,
            min = a,
            med = a;
        if (b > max) {
            max = b;
        } else if (b < min) {
            min = b;
        }
        if (c > max) {
            med = max;
        } else if (c < min) {
            med = min;
        } else {
            med = c;
        }
        return med;
    }

    /*
     Check if neighbour macroblock is available. Neighbour macroblock
     is considered available if it is within the picture and belongs
     to the same slice as the current macroblock.
     */
    function isNeighbourAvailable(mb, neighbour) {
        if (!neighbour || mb.slice != neighbour.slice) {
            return false;
        }
        return true;
    }

    function clip3(x, y, z) {
        if (z < x) {
            return x;
        } else if (z > y) {
            return y;
        } else {
            return z;
        }
    }
    
    function clip1(x) {
        return clip3(0, 255, x);
    }
    
    function inverseScanTransformCoeff(list) {
        return [
            [list[0], list[1], list[5], list[6]],
            [list[2], list[4], list[7], list[12]],
            [list[3], list[8], list[11], list[13]],
            [list[9], list[10], list[14], list[15]]
        ];
    }

    function inverse4x4LumaBlockScan(luma4x4BlkIdx) {
        return {
            x: inverseRasterScan(luma4x4BlkIdx >> 2, 8, 8, 16, 0) + inverseRasterScan(luma4x4BlkIdx % 4, 4, 4, 8, 0),
            y: inverseRasterScan(luma4x4BlkIdx >> 2, 8, 8, 16, 1) + inverseRasterScan(luma4x4BlkIdx % 4, 4, 4, 8, 1)
        };
    }
    function inverseMbScan(mbaddr, width) {
        return {
            x: inverseRasterScan(mbaddr, 16, 16, width, 0),
            y: inverseRasterScan(mbaddr, 16, 16, width, 1)
        };
    }
    
    return {
        isISlice: isISlice,
        isPSlice: isPSlice,
        getNeighbourA4x4: getNeighbourA4x4,
        getNeighbourB4x4: getNeighbourB4x4,
        getNeighbourC4x4: getNeighbourC4x4,
        getNeighbourD4x4: getNeighbourD4x4,
        isNeighbourAvailable: isNeighbourAvailable,
        LevelScale: LevelScale,
        inverseRasterScan: inverseRasterScan,
        clip3: clip3,
        clip1: clip1,
        medianFilter: medianFilter,
        inverseScanTransformCoeff: inverseScanTransformCoeff,
        inverse4x4LumaBlockScan: inverse4x4LumaBlockScan,
        inverseMbScan: inverseMbScan
    };
});