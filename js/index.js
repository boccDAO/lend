layui.define(['layer', 'element', 'jquery'], function (exports) {
    var layer = layui.layer
        , ele = layui.element
        , $ = layui.jquery;
    var days = 0; //选择的天数

    var TetherTokenABI, TetherToken, BlockDebitABI, BlockDebit;
    var cb = {
        inited: false,
        giveDebitEther: 0,
        giveDebitDay: 0,
        currentETH: 0,
        currentUSDT: 0,
        debitInfo: [new BigNumber(123.4567), new BigNumber(123.4567), new BigNumber(123.4567), new BigNumber(0), new BigNumber(0)],
        exchangeRate: 0,
        owner: 0,
        ownerToken: 0,
        ownerApprove: 0,
        user: "",
        daysInterest: 0,
        blockDebitAddress: ''
    }

    $('#apply-for-loan').click(function () {
        console.log("跳转" + $("#bocc-main").offset().top);
        $("html,body").animate({ scrollTop: $("#bocc-main").offset().top }, 500);
    });

    $('.bocc-loan-btn').hover(function () {
        $(this).text(location.pathname === '/' ?  'Borrowing' : '立即借款');
    }, function () {
        $(this).text($(this).attr('text-data'));
    });

    $('.bocc-loan-btn').on('click', function () {
        if (typeof web3 == 'undefined') {
            layer.msg(location.pathname === '/' ? 'You have not bundled the metamask wallet' : '您需要先安装 MetaMask');
            return;
        }
        if (web3.eth.coinbase === null) {
            layer.msg(location.pathname === '/' ? 'You have to unlock metamask' : '请解锁 MetaMask 并刷新此页面');
            return;
        }

        console.log($(this).attr("days-data"));
        days = $(this).attr("days-data");
        layer.open({
            type: 2,
            title: false,
            closeBtn: 0,
            shadeClose: true,
            area: ['400px', '320px'],
            content: location.pathname === '/' ? '/loan_window_en.html' : '/loan_window.html',
            success: function (layero, index) {
                var body = layer.getChildFrame('body', index);
                var iframeWin = window[layero.find('iframe')[0]['name']];
                // var inputList = body.find('input');
                // for(var j = 0; j< inputList.length; j++){
                //     $(inputList[j]).val(arr[j]);
                // }
            }
        });
    });

    $('#loan-give').click(function () {
        layer.open({
            type: 2,
            title: false,
            closeBtn: 0,
            shadeClose: true,
            area: ['400px', '320px'],
            content: location.pathname === '/' ? '/back_window_en.html' : '/back_window.html' ,
            success: function (layero, index) {
                var body = layer.getChildFrame('body', index);
                var iframeWin = window[layero.find('iframe')[0]['name']];
                // var inputList = body.find('input');
                // for(var j = 0; j< inputList.length; j++){
                //     $(inputList[j]).val(arr[j]);
                // }
            }
        });
    });

    if (typeof web3 == 'undefined') {
        //layer.msg('您需要先安装 MetaMask', { shade: 0.3, time: 30000 });
        console.log('安装metamask');
        $('#bocc-user-info').hide();
        $('#bocc-no-metamask').show();
        return;
    } else {
        console.log('隐藏');
        $('#bocc-user-info').show();
        $('#bocc-no-metamask').hide();
    }


    web3.version.getNetwork(function (e, networkID) {
        TetherTokenAddress = TetherTokenJSON.networks[networkID].address;
        BlockDebitAddress = BlockDebitJSON.networks[networkID].address;
        cb.user = web3.eth.coinbase;

        eth = new Eth(web3.currentProvider);
        TetherTokenABI = TetherTokenJSON.abi
        TetherToken = eth.contract(TetherTokenABI).at(TetherTokenAddress);

        BlockDebitABI = BlockDebitJSON.abi
        BlockDebit = eth.contract(BlockDebitABI).at(BlockDebitAddress);

        update()
        updateDaysInterest()

        $('#contractadres').text(BlockDebitAddress);
        $('#wallet-address').text(cb.user);
        $('#have-eth').text(cb.currentETH / 10 ** 18);
        $('#have-usdt').text(cb.currentUSDT / 10 ** 6);
        $('#mortgage-eth').text(cb.debitInfo[0].toString() / 10 ** 18);
        $('#repay-usdt').text(cb.debitInfo[1].toString() / 10 ** 6);
        $('#repay-date').text(new Date(cb.debitInfo[2].toNumber() * 1000).format("yyyy-MM-dd hh:mm:ss"));
        $('#loan-rate').text(cb.exchangeRate / 10 ** 4);
    });

    function giveDebit(giveDebitEther) {
        BlockDebit.giveDebit(days, {
            'from': web3.eth.coinbase,
            'value': web3.toWei(giveDebitEther, 'ether'),
            'gasLimit': 400000,
        }).then(function () {
            update()
        })
    }

    function backDebit1() {
        TetherToken.approve(BlockDebitAddress, 0, {
            'from': web3.eth.coinbase
        })
    }

    function backDebit2() {
        console.log('backDebit2', BlockDebitAddress, cb.debitInfo[1])
        TetherToken.approve(BlockDebitAddress, cb.debitInfo[1], {
            'from': web3.eth.coinbase
        });
    }

    function backDebit3() {
        console.log('backDebit3')
        BlockDebit.backDebit({
            'from': web3.eth.coinbase
        })
    }

    function backDebit() {
        console.log('backDebit2', BlockDebitAddress, cb.debitInfo[1])
        TetherToken.approve(BlockDebitAddress, cb.debitInfo[1], {
            'from': web3.eth.coinbase
        }).then(function () {
            console.log('backDebit3')
            BlockDebit.backDebit({
                'from': web3.eth.coinbase
            })
        })
    }

    function update() {
        BlockDebit.owner().then(r => cb.owner = r[0]).then(function () {
            TetherToken.balanceOf(cb.owner).then(
                r => cb.ownerToken = r[0].toNumber()
            ).then(function () {
                $('#ownertoken').text(cb.ownerToken / 10 ** 6)
            });
        }).then(function () {
            TetherToken.allowance(cb.owner, BlockDebitAddress).then(
                r => cb.ownerApprove = r[0].toNumber()
            ).then(function () {
                $('#ownerapprove').text(cb.ownerApprove / 10 ** 6)
            })
        });

        // ------------------------------------------------------------
        cb.user = web3.eth.coinbase

        // ------------------------------------------------------------
        web3.eth.getBalance(web3.eth.coinbase, function (err, balance) {
            if (err === null) {
                cb.currentETH = balance.toNumber()
                a = new Number(cb.currentETH / 10 ** 18)
                $('#have-eth').text(a.toFixed(3));
            }
        });
        TetherToken.balanceOf(web3.eth.coinbase).then(function (r) {
            cb.currentUSDT = r[0].toNumber()
            a = new Number(cb.currentUSDT / 10 ** 6)
            $('#have-usdt').text(a.toFixed(3))
        });

        // 借贷信息
        BlockDebit.info(web3.eth.coinbase).then(
            r => cb.debitInfo = r[0]
        ).then(function () {
            if (cb.debitInfo[0].toString() === '0') {
                $('#debit-info').hide()
                $('#debit-info-back').hide()
                $('#debit-info-none').show()
            } else {
                $('#mortgage-eth').text(cb.debitInfo[0].toString() / 10 ** 18);
                $('#repay-usdt').text(cb.debitInfo[1].toString() / 10 ** 6);
                $('#repay-date').text(new Date(cb.debitInfo[2].toNumber() * 1000).format("yyyy-MM-dd"));
                $('#debit-info').show()
                $('#debit-info-back').show()
                $('#debit-info-none').hide()
            }
        })
        // 当前借贷利率
        BlockDebit.exchangeRate().then(
            r => cb.exchangeRate = r[0].toNumber()
        ).then(function () {
            $('#loan-rate').text(cb.exchangeRate / 10 ** 4);
        })
    }

    function updateDaysInterest() {
        BlockDebit.getInterest(cb.giveDebitDay).then(function (r) {
            web3.eth.getBlockNumber(function (err, n) {
                if (n > r[0][1].toNumber()) {
                    cb.daysInterest = r[0][2].toNumber()
                } else {
                    cb.daysInterest = r[0][0].toNumber()
                }
            })
        })
    }

    window.giveDebit = giveDebit;
    window.backDebit1 = backDebit1;
    window.backDebit2 = backDebit2;
    window.backDebit3 = backDebit3;
    window.backDebit = backDebit;
    window.update = update;
    window.cb = cb;

    Date.prototype.format = function (fmt) {
        var o = {
            "M+": this.getMonth() + 1,                 //月份
            "d+": this.getDate(),                    //日
            "h+": this.getHours(),                   //小时
            "m+": this.getMinutes(),                 //分
            "s+": this.getSeconds(),                 //秒
            "q+": Math.floor((this.getMonth() + 3) / 3), //季度
            "S": this.getMilliseconds()             //毫秒
        };
        if (/(y+)/.test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            }
        }
        return fmt;
    }

    exports('index', {});
});
