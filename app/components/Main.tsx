'use client'

import axios, { CancelTokenSource } from "axios";
import { useRef, useState } from "react"
import { MessageType, Task } from "./types"

// const TEXT_MESSAGES:Text[] = [
//     {
//         type: 'objective',
//         text: 'テスト目的'
//     },
//     {
//         type: 'task-list',
//         text: 'テスト2'
//     },
//     {
//         type: 'next-task',
//         text: '1.テストタスク1'
//     },
//     {
//         type: 'task-result',
//         text: 'テストタスク1結果'
//     },
//     {
//         type: 'next-task',
//         text: '2.テストタスク2'
//     },
//     {
//         type: 'task-result',
//         text: 'テストタスク2結果'
//     }
// ]

const Main = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [messages, setMessages] = useState<MessageType[]>([]);
    const objectiveRef = useRef<HTMLTextAreaElement>(null);
    const iterationRef = useRef<HTMLInputElement>(null);
    const messageEndRef = useRef<HTMLDivElement>(null);
    const sourceRef = useRef<CancelTokenSource | null>(null);

    //message設定
    const messageHandler = (message:MessageType) => {
        setMessages((messages) => [...messages, message])
    };

    //スタート
    const startHandler = async () => {
        //loading開始
        setLoading(true)

        //目的取得
        const objective = objectiveRef.current!.value

        //目的チェック
        if (!objective) {
            setLoading(false);
            return
        }

        //apiキャンセルトークンの設定と任意でこのタイミングでリクエストを停止
        sourceRef.current = axios.CancelToken.source();

        //メッセージに目的を追加
        const messageObjective = { type: "objective", text: objective }
        messageHandler(messageObjective);

        let taskList:Task[] = [];

        //タスクリスト取得
        taskList.push({ taskId: "1", taskName: "目的を達成するためのタスクを設定してください" });

        //ループ回数初期化
        let iteration = 0;

        //最大ループ回数取得
        const maxIteration = Number(iterationRef.current!.value)

        //ループ開始
        try {
            while (maxIteration === 0 || iteration < maxIteration) {
                //タスクリストの確認
                if (taskList.length <= 0) {
                    setLoading(false);
                    return
                }
                //タスクリストの配列を文字列化
                const taskListString = taskList.map((task) => `${task.taskId}.${task.taskName}`).join("\n");

                //タスクリストをメッセージに追加
                const messageTaskList = { type: "task-list", text: taskListString };
                messageHandler(messageTaskList);

                //最初のタスクリストを取得して削除
                const task = taskList.shift()!;

                //次に実行するタスクをメッセージに追加
                const messageNextTask = { type: "next-task", text: task.taskName };
                messageHandler(messageNextTask);

                //ChatGPTに質問を投げる
                const responseExecute = await axios.post(
                    "/api/execute",
                    //目的とタスクを送信
                    { objective: objective, task: task.taskName },
                    //キャンセルトークンを設定
                    { cancelToken: sourceRef.current!.token }
                );
                //回答を取得
                const responseText = responseExecute?.data?.response;
                //回答をメッセージに追加
                const messageTaskResult = { type: "task-result", text: responseText.trim() };
                messageHandler(messageTaskResult);

                //api/createエンドポイントにGPTに向けタスク作成を依頼
                const responseCreate = await axios.post(
                    "/api/create",
                    //目的、タスクリスト名,最後のタスク,回答を送信
                    { objective, taskList, task, result: responseText },
                    //キャンセルトークンを設定
                    { cancelToken: sourceRef.current!.token }
                );
                //新しいタスクリストに更新
                taskList = responseCreate?.data?.taskList;
                //ループ回数を更新
                iteration++;
                //目的をクリア
                objectiveRef.current!.value = "";
            }
        } catch (error) {
            //axiosでキャンセルされた場合
            if (axios.isCancel(error)) {
                console.log("Request canceled", error.message);
            }  
        } finally {
                //loading終了
                setLoading(false);
        }
    };

    //ストップ
    const stopHandler = () => {};

    return (
        <div>
            <div className="grid grid-cols-4 h-[var(--adjusted-height)] mb-5 text-sm border rounded-md">
                <div className="col-span-1 rounded-s-lg p-3 overflow-y-auto bg-gray-50 border-r">
                    {/* {タスクリスト} */}
                    <div className="font-bold mb-3">tasks</div>
                    {messages
                        .filter((data) => data.type === 'task-list')
                        .slice(-1)
                        .map((data,index) => (
                            <div key={index}>
                                <div className="leading-relaxed break-words whitespace-pre-wrap">{data.text}</div>
                            </div>
                        ))}
                </div>

                <div className="col-span-3 rounded-e-lg overflow-y-auto bg-white">
                    {/* メッセージ */}
                    {messages.map((data,index) => (
                        <div key={index}>
                            {data.type === 'objective' ? (
                                <div className="text-center mb-4 font-bold text-lg border-b bg-gray-50">
                                    <div>🎯{data.text}</div>
                                </div>
                            ) : data.type === 'task-result' ? (
                                <div className="flex items-center justify-end mb-4">
                                    <div className="bg-orange-500 text-white p-3 rounded-xl drop-shadow max-w-lg mr-6">
                                        <div className="leading-relaxed break-words whitespace-pre-wrap">
                                            {data.text}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-start mb-4">
                                    <div className="bg-gray-500 text-white p-3 rounded-xl drop-shadow max-w-lg ml-6">
                                        <div className="leading-relaxed break-words whitespace-pre-wrap">
                                            {data.text}
                                        </div>
                                    </div>
                                </div>
                            )}
                            </div>
                        ))}
                        {/* ローディング */}
                        {loading && (
                            <div>
                                <div className="flex items-center justify-center my-3">
                                    <div className="px-5 py-2 text-white bg-orange-500 rounded-full animate-ping">
                                        thinking...
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messageEndRef}/>
                </div>
            </div>

            <div>
                <div className="mb-3 grid grid-cols-12 gap-3">
                    <div className="col-span-1">
                        {/* {ループ回数入力} */}
                        <input
                            className="w-full border rounded-lg py-2 px-3 focus:outline-none bg-gray-50 focus:bg-white"
                            type="number" 
                            ref={iterationRef}
                            id="iteration"
                            defaultValue={5}
                            disabled={loading}/>
                    </div>
                    <div className="col-span-11">
                        {/* 目的入力 */}
                        <textarea
                            className="w-full border rounded-lg py-2 px-3 focus:outline-none bg-gray-50 focus:outline-white"
                            id="objective"
                            rows={1}
                            placeholder="Your Objective" 
                            ref={objectiveRef}
                            disabled={loading}
                            />
                    </div>
                </div>
                <div className="flex items-center justify-center space-x-5">
                    {/* スタート */}
                    <button
                    className={`p-3 border rounded-lg w-32 text-white font-bold ${
                        loading ? "bg-gray-500" : "bg-orange-500"
                    }`}
                    onClick={startHandler}
                    disabled={loading}>
                    start
                    </button>
                    {/* ストップ */}
                    <button
                    className={`p-3 border rounded-lg w-32 text-white font-bold ${
                        loading ? "bg-orange-500" : "bg-gray-500"
                    }`}
                    onClick={stopHandler}
                    disabled={!loading}>
                    stop
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Main