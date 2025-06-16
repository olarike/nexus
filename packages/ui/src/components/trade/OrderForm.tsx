'use client';

import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { UsdcIconCircle } from '../vault/UsdcIconCircle';
import { AaplIconCircle } from './AaplIconCircle';
import { POOL_CONFIG, PRICE_DECIMALS } from '@/lib/constants';
import { getTokenAddress, tokenAddressToTokenE, TokenE } from '@/lib/TokenUtils';
import { fetchTokenBalance } from '@/lib/retrieveData';
import { openPosition } from '@/actions/openPosition';
import { BN } from '@coral-xyz/anchor';
import { sleep } from '@/lib/TransactionHandlers';
import { usePositions } from '@/hooks/usePositions';
import { usePythPrices } from '@/hooks/usePythPrices';

interface OrderFormProps {
  symbol?: string;
}

const TOKEN_E_LIST = POOL_CONFIG.tokens.map((token) => {
  return tokenAddressToTokenE(token.mintKey.toBase58());
});

enum InputType {
  Pay = "pay",
  Position = "position",
}

const OrderForm = ({ symbol = 'AAPL' }: OrderFormProps) => {
  const { wallet, publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const [leverage, setLeverage] = useState<number>(2);
  const [payAmount, setPayAmount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("market");
  const [activeSideTab, setActiveSideTab] = useState<string>("buy");
  const [payToken] = useState(TOKEN_E_LIST[0]);
  const [payTokenBalance, setPayTokenBalance] = useState(0);
  const [positionAmount, setPositionAmount] = useState(0);
  const [lastChanged, setLastChanged] = useState<InputType>(InputType.Pay);
  const [positionToken] = useState(TokenE.AAPL);
  const { fetchPositions } = usePositions();
  const { prices } = usePythPrices();

  useEffect(() => {
    if (lastChanged === InputType.Pay) {
      setPositionAmount(payAmount * leverage);
    } else {
      setPayAmount(positionAmount / leverage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leverage]);

  useEffect(() => {
    async function fetchData() {
      const tokenBalance = await fetchTokenBalance(
        payToken!,
        publicKey!,
        connection
      );
      setPayTokenBalance(tokenBalance);

      // TODO: Сreating LP POSITION FIRST TIME MAKE SURE TO SET IN STORE 
      // let lpBalance = await fetchLPBalance(
      //   POOL_CONFIG.lpTokenMint,
      //   publicKey!,
      //   connection
      // );
      // setUserLpTokenBalance(lpBalance);
    }

    if (publicKey && payToken) {
      fetchData();
    }
  }, [connection, payToken, publicKey]);
  
  async function handleOpenPosition() {
    const positionTokenCustody = POOL_CONFIG.custodies.find(i => i.mintKey.toBase58() === getTokenAddress(positionToken));

    await openPosition(
      wallet!,
      publicKey,
      signTransaction,
      connection,
      payToken,
      positionToken,
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      new BN(payAmount * 10**(positionTokenCustody?.decimals!)),
      // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
      new BN(positionAmount * 10**(positionTokenCustody?.decimals!)),
      new BN((prices.get(payToken) ?? 0) * 10 ** PRICE_DECIMALS),
      activeSideTab
    );

    // fetch and add to store
    console.log("sleep 5sec");
    await sleep(5000);
    console.log("after sleep calling fetchPositions");
    fetchPositions();
  }

  return (
    <div className="rounded-lg bg-[#121212] p-4 border border-gray-800">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between mb-4">
          <TabsList className="bg-gray-900">
            <TabsTrigger value="market" className="data-[state=active]:bg-gray-800">Market</TabsTrigger>
            {/* <TabsTrigger value="limit" className="data-[state=active]:bg-gray-800">Limit</TabsTrigger> */}
          </TabsList>
        </div>
        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              className={`${activeSideTab === 'buy' ? 'bg-[#18211D] text-[#C8FF00]' : 'border-gray-700 text-white'} hover:bg-[#213026]`}
              variant={activeSideTab === 'buy' ? 'default' : 'outline'}
              onClick={() => setActiveSideTab('buy')}
            >
              Buy
            </Button>
            <Button 
              className={`${activeSideTab === 'sell' ? 'bg-[#211818] text-[#FF6666]' : 'border-gray-700 text-white'} hover:bg-[#302121]`}
              variant={activeSideTab === 'sell' ? 'default' : 'outline'}
              onClick={() => setActiveSideTab('sell')}
            >
              Sell
            </Button>
          </div>
          <div>
            <p className="mb-2 text-gray-400 flex justify-between">
              Pay
              {
                connected && <span>Balance: {payTokenBalance.toFixed(2)}</span>
              }
            </p>
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <Input 
                  type="number"
                  value={payAmount} 
                  onChange={(e) => {
                    setPayAmount(Number(e.target.value));
                    setPositionAmount(Number(e.target.value) * leverage);
                    setLastChanged(InputType.Pay);
                  }}
                  className="bg-[#1E1E1E] border-gray-700 pr-16"
                />
              </div>
              <div className="flex items-center px-4 py-2 bg-[#1E1E1E] rounded-md">
                <UsdcIconCircle className="h-5 w-5 mr-2" />
                <span>USDC</span>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-gray-400">Estimated Size</p>
            <div className="flex items-center space-x-2">
              <div className="relative flex-grow">
                <Input 
                  value={positionAmount} 
                  onChange={(e) => {
                    setPayAmount(Number(e.target.value) / leverage);
                    setPositionAmount(Number(e.target.value));
                    setLastChanged(InputType.Position);
                  }}
                  className="bg-[#1E1E1E] border-gray-700 pr-16"
                />
              </div>
              <div className="flex items-center px-4 py-2 bg-[#1E1E1E] rounded-md">
                <AaplIconCircle className="h-5 w-5 mr-2" />
                <span>{symbol}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <p className="text-gray-400">Leverage</p>
              <div className="w-16 relative">
                <Input
                  type="number"
                  value={leverage}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 1 && value <= 100) {
                      setLeverage(value);
                    }
                  }}
                  min={1}
                  max={100}
                  className="h-7 px-2 pr-6 text-center bg-[#1E1E1E] border-gray-700"
                  aria-label="Leverage value"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">x</span>
              </div>
            </div>
            <Slider 
              value={[leverage]} 
              min={1} 
              max={100}
              step={1}
              onValueChange={(value) => setLeverage(value[0])}
              className="my-4"
            />
            <div className="grid grid-cols-6 gap-2 text-sm">
              <button 
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => setLeverage(3)}
              >3x</button>
              <button 
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => setLeverage(5)}
              >5x</button>
              <button 
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => setLeverage(10)}
              >10x</button>
              <button 
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => setLeverage(25)}
              >25x</button>
              <button 
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => setLeverage(50)}
              >50x</button>
              <button 
                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => setLeverage(100)}
              >100x</button>
            </div>
          </div>
          {connected ? (
            <Button className={`w-full font-bold py-6 ${
              activeSideTab === 'buy' 
                ? 'bg-[#C8FF00] hover:bg-[#BDFF00] text-black' 
                : 'bg-[#FF6666] hover:bg-[#FF5555] text-white'
              }`}
              onClick={handleOpenPosition}
            >
              Open Position
            </Button>
          ) : (
            <div className="orderform-wallet-btn">
              <WalletMultiButton className="w-full font-bold py-6 !bg-[#23262B] !text-white !rounded-lg" />
            </div>
          )}
        </TabsContent>
        {/* <TabsContent value="limit">
          <div className="text-gray-400">
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button 
                className={`${activeSideTab === 'buy' ? 'bg-[#18211D] text-[#C8FF00]' : 'border-gray-700 text-white'} hover:bg-[#213026]`}
                variant={activeSideTab === 'buy' ? 'default' : 'outline'}
                onClick={() => setActiveSideTab('buy')}
              >
                Buy
              </Button>
              <Button 
                className={`${activeSideTab === 'sell' ? 'bg-[#211818] text-[#FF6666]' : 'border-gray-700 text-white'} hover:bg-[#302121]`}
                variant={activeSideTab === 'sell' ? 'default' : 'outline'}
                onClick={() => setActiveSideTab('sell')}
              >
                Sell
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-gray-400">Price</p>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <Input 
                      value="147.08" 
                      className="bg-[#1E1E1E] border-gray-700 pr-16"
                    />
                  </div>
                  <div className="flex items-center px-4 py-2 bg-[#1E1E1E] rounded-md">
                    <span>USD</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="mb-2 text-gray-400">Amount</p>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <Input 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)}
                      className="bg-[#1E1E1E] border-gray-700 pr-16"
                    />
                  </div>
                  <div className="flex items-center px-4 py-2 bg-[#1E1E1E] rounded-md">
                    <span>USDC</span>
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <p className="text-gray-400">Leverage</p>
                  <div className="w-16 relative">
                    <Input
                      type="number"
                      value={leverage}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 1 && value <= 100) {
                          if (lastChanged === InputType.Pay) {
                            setPositionAmount(payAmount * value);
                          } else {
                            setPayAmount(positionAmount / value);
                          }

                          setLeverage(value);
                        }
                      }}
                      min={1}
                      max={100}
                      className="h-7 px-2 pr-6 text-center bg-[#1E1E1E] border-gray-700"
                      aria-label="Leverage value"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">x</span>
                  </div>
                </div>
                <Slider 
                  value={[leverage]} 
                  min={1} 
                  max={100}
                  step={1}
                  onValueChange={(value) => {
                    const x = value[0];

                    if (lastChanged === InputType.Pay) {
                      setPositionAmount(payAmount * x);
                    } else {
                      setPayAmount(positionAmount / x);
                    }

                    setLeverage(x);
                  }}
                  className="my-4"
                />
                <div className="grid grid-cols-6 gap-2 text-sm">
                  <button 
                    className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700"
                    onClick={() => setLeverage(3)}
                  >3x</button>
                  <button 
                    className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700"
                    onClick={() => setLeverage(5)}
                  >5x</button>
                  <button 
                    className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700"
                    onClick={() => setLeverage(10)}
                  >10x</button>
                  <button 
                    className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700"
                    onClick={() => setLeverage(25)}
                  >25x</button>
                  <button 
                    className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700"
                    onClick={() => setLeverage(50)}
                  >50x</button>
                  <button 
                    className="px-1 py-1 rounded bg-gray-800 hover:bg-gray-700"
                    onClick={() => setLeverage(100)}
                  >100x</button>
                </div>
              </div>
              
              {connected ? (
                <Button className={`w-full font-bold py-6 ${
                  activeSideTab === 'buy' 
                    ? 'bg-[#C8FF00] hover:bg-[#BDFF00] text-black' 
                    : 'bg-[#FF6666] hover:bg-[#FF5555] text-white'
                }`}>
                  {activeSideTab === 'buy' ? 'Buy / Long' : 'Sell / Short'}
                </Button>
              ) : (
                <div className="orderform-wallet-btn">
                  <WalletMultiButton />
                </div>
              )}
            </div>
          </div>
        </TabsContent> */}
      </Tabs>
    </div>
  );
};

export default OrderForm;
