//********************js/feature/tribble.js***************************************

loadTribbleIndex = function (indexFile, config) {

        var genome = null;

        //console.log("Loading " + indexFile);
        return new Promise(function (fulfill, reject) {

            igvxhr.loadArrayBuffer(indexFile,
                {
                    headers: config.headers,
                    withCredentials: config.withCredentials
                }).then(function (arrayBuffer) {

                    if (arrayBuffer) {

                        var index = {};

                        var parser = new BinaryParser(new DataView(arrayBuffer));

                        readHeader(parser);  // <= nothing in the header is actually used

                        var nChrs = parser.getInt();
                        while (nChrs-- > 0) {
                            // todo -- support interval tree index, we're assuming its a linear index
                            var chrIdx = readLinear(parser);
                            index[chrIdx.chr] = chrIdx;
                        }

                        fulfill(new TribbleIndex(index));
                    }
                    else {
                        fulfill(null);
                    }

                }).catch(function (error) {
                    console.log(error);
                    fulfill(null);
                });


            function readHeader(parser) {

                //var magicString = view.getString(4);
                var magicNumber = parser.getInt();     //   view._getInt32(offset += 32, true);
                var type = parser.getInt();
                var version = parser.getInt();

                var indexedFile = parser.getString();

                var indexedFileSize = parser.getLong();

                var indexedFileTS = parser.getLong();
                var indexedFileMD5 = parser.getString();
                flags = parser.getInt();
                if (version < 3 && (flags & SEQUENCE_DICTIONARY_FLAG) == SEQUENCE_DICTIONARY_FLAG) {
                    // readSequenceDictionary(dis);
                }

                if (version >= 3) {
                    var nProperties = parser.getInt();
                    while (nProperties-- > 0) {
                        var key = parser.getString();
                        var value = parser.getString();
                    }
                }
            }

            function readLinear(parser) {

                var chr = parser.getString(),
                    blockMax = 0;

                // Translate to canonical name
                if (genome) chr = genome.getChromosomeName(chr);

                var binWidth = parser.getInt();
                var nBins = parser.getInt();
                var longestFeature = parser.getInt();
                //largestBlockSize = parser.getInt();
                // largestBlockSize and totalBlockSize are old V3 index values.  largest block size should be 0 for
                // all newer V3 block.  This is a nasty hack that should be removed when we go to V4 (XML!) indices
                var OLD_V3_INDEX = parser.getInt() > 0;
                var nFeatures = parser.getInt();

                // note the code below accounts for > 60% of the total time to read an index
                var blocks = new Array();
                var pos = parser.getLong();
                var chrBegPos = pos;

                var blocks = new Array();
                for (var binNumber = 0; binNumber < nBins; binNumber++) {
                    var nextPos = parser.getLong();
                    var size = nextPos - pos;
                    blocks.push({min: pos, max: nextPos}); //        {position: pos, size: size});
                    pos = nextPos;

                    if (nextPos > blockMax) blockMax = nextPos;
                }

                return {chr: chr, blocks: blocks};

            }


        });
    }


class TribbleIndex{
    constructor (chrIndexTable) {
        this.chrIndex = chrIndexTable;      // Dictionary of chr -> tribble index
    }

    /**
     * Fetch blocks for a particular genomic range.
     *
     * @param refId  the sequence dictionary index of the chromosome
     * @param min  genomic start position
     * @param max  genomic end position
     * @param return an array of {minv: {block: filePointer, offset: 0}, {maxv: {block: filePointer, offset: 0}}
     */
    blocksForRange(queryChr, min, max) { //function (refId, min, max) {

        var chrIdx = this.chrIndex[queryChr];

        if (chrIdx) {
            var blocks = chrIdx.blocks,
                lastBlock = blocks[blocks.length - 1],
                mergedBlock = {minv: {block: blocks[0].min, offset: 0}, maxv: {block: lastBlock.max, offset: 0}};

            return [mergedBlock];
        }
        else {
            return null;
        }


    }

}

export {loadTribbleIndex};