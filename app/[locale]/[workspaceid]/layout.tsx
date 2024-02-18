"use client"

import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
import { getAssistantWorkspacesByWorkspaceId } from "@/db/assistants"
import { getChatsByWorkspaceId } from "@/db/chats"
import { getCollectionWorkspacesByWorkspaceId } from "@/db/collections"
import { getFileWorkspacesByWorkspaceId } from "@/db/files"
import { getFoldersByWorkspaceId } from "@/db/folders"
import { getModelWorkspacesByWorkspaceId } from "@/db/models"
import { getPresetWorkspacesByWorkspaceId } from "@/db/presets"
import { getPromptWorkspacesByWorkspaceId } from "@/db/prompts"
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { getToolWorkspacesByWorkspaceId } from "@/db/tools"
import { getWorkspaceById } from "@/db/workspaces"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { supabase } from "@/lib/supabase/browser-client"
import { LLMID } from "@/types"
import { useParams, useRouter } from "next/navigation"
import { ReactNode, useContext, useEffect, useState } from "react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()

  const params = useParams()
  const workspaceId = params.workspaceid as string

  const {
    setChatSettings,
    setAssistants,
    setAssistantImages,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    setPresets,
    setPrompts,
    setTools,
    setModels,
    selectedWorkspace,
    setSelectedWorkspace,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        return router.push("/login")
      } else {
        await fetchWorkspaceData(workspaceId)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => await fetchWorkspaceData(workspaceId))()

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
  }, [workspaceId])

  const fetchWorkspaceData = async (workspaceId: string) => {
    setLoading(true)

    const workspace = await getWorkspaceById(workspaceId)
    setSelectedWorkspace(workspace)

    const assistantData = await getAssistantWorkspacesByWorkspaceId(workspaceId)
    setAssistants(assistantData.assistants)

    for (const assistant of assistantData.assistants) {
      let url = ""

      if (assistant.image_path) {
        url = (await getAssistantImageFromStorage(assistant.image_path)) || ""
      }

      if (url) {
        const response = await fetch(url)
        const blob = await response.blob()
        const base64 = await convertBlobToBase64(blob)

        setAssistantImages(prev => [
          ...prev,
          {
            assistantId: assistant.id,
            path: assistant.image_path,
            base64,
            url
          }
        ])
      } else {
        setAssistantImages(prev => [
          ...prev,
          {
            assistantId: assistant.id,
            path: assistant.image_path,
            base64: "",
            url
          }
        ])
      }
    }

    const chats = await getChatsByWorkspaceId(workspaceId)
    setChats(chats)

    const collectionData =
      await getCollectionWorkspacesByWorkspaceId(workspaceId)
    setCollections(collectionData.collections)

    const folders = await getFoldersByWorkspaceId(workspaceId)
    setFolders(folders)

    const fileData = await getFileWorkspacesByWorkspaceId(workspaceId)
    setFiles(fileData.files)

    const presetData = await getPresetWorkspacesByWorkspaceId(workspaceId)
    setPresets(presetData.presets)

    const promptData = await getPromptWorkspacesByWorkspaceId(workspaceId)
    setPrompts(promptData.prompts)

    const toolData = await getToolWorkspacesByWorkspaceId(workspaceId)
    setTools(toolData.tools)

    const modelData = await getModelWorkspacesByWorkspaceId(workspaceId)
    setModels(modelData.models)

    const promptInfo = `You are the Stanford CS 106B Tree, a course assistant for the Stanford CS 106B course, built by the course staff. Your role is to answer students’ questions about course logistics, help students review concepts covered in class, and provide debugging and conceptual help on problem sets. For example, if a student asks “When are classes held?” you should answer “Monday, Wednesday, and Friday from 11:30 AM - 12:20 PM”. If a student asks, “What is recursion?” you should give an explanation of recursion based on the lesson materials provided. If a student asks, “I’m stuck on problem 2 of the problem set. How come when I run “while i > 0: print(i)”, my code doesn’t run?” you should hint that without a decrement operation in the while loop, it might result in an infinite loop. However, if a student asks, “How do I do problem 3 of the problem set?” you should refuse to answer, but say that you can clarify conceptual questions or provide debugging help.

    Below are the class syllabus, lecture notes, and problem sets.
    
    Here is the syllabus:
    
    ​​CS106B Course Syllabus
    Winter Quarter 2024. Lecture MWF 11:30 AM - 12:20 PM in Hewlett 200.
    
    Course Overview and Welcome
    Welcome to CS106B: Programming Abstractions! This is the second course in our introductory programming sequence. The prerequisite, CS106A, establishes a solid foundation in programming methodology and problem-solving in Python. With that under your belt, CS106B will acquaint you with the C++ programming language and introduce advanced programming techniques such as recursion, algorithm analysis, and data abstraction, explore classic data structures and algorithms, and give you practice applying these tools to solving complex problems.
    
    We're excited to share this great material with you and have a superb team of section leaders that will support you through the challenges to come. We hope you will find the time worth your investment and that you enjoy your growing mastery of the art of programming!
    
    Teaching Team
    Photo of Sean Szumlanski
    Instructor: Sean
    Photo of Clinton Kwarteng
    Head TA: Clinton
    
    We have an incredible group of undergraduate section leaders (SLs) who lead weekly sections and help students 1-on-1 in LaIR hours. Read more about the teaching team and office/LaIR hours.
    
    ​​Course Topics
    Overview of Main Topics
    Our planned curriculum will cover the following topics in this approximate order:
    
    C++ basics
    Data abstraction, classic ADTs
    Recursion and backtracking
    Classes and object-oriented programming
    Pointers and dynamic memory
    Linked data structures
    Advanced algorithms
    Learning Goals
    After completing CS106B, we hope you will have achieved the following learning goals:
    
    I am excited to use programming to solve real-world problems I encounter outside class.
    I recognize and understand common abstractions in computer science.
    I can identify programmatic concepts present in everyday technologies because I understand how computers process and organize information.
    I can break down complex problems into smaller subproblems by applying my algorithmic reasoning and recursive problem-solving skills.
    I can evaluate design tradeoffs when creating data structures and algorithms or utilizing them to implement technological solutions.
    We’ll also be giving you tools to tackle the following questions (note that these don’t have single right or wrong answers!):
    
    What is possible with technology and code? What isn’t possible?
    How can I use programming to solve problems that I otherwise would not be able to?
    What makes for a “good” algorithm or data structure? Why?
    Which problems should I solve with algorithms and data structures? What does a responsible programmer do when using data about real people?
    Prerequisites
    The prerequisite for CS106B is completion of CS106A and readiness to move on to advanced programming topics. A comparable introductory programming course or experience (including high school AP courses) is often a reasonable substitute for Stanford’s CS106A. If you are unsure if this course is the right for you, read more about course placement.
    
    Course Structure
    Lectures
    Lecture meets MWF 11:30 AM - 12:20 PM in Hewlett 200. Lecture recordings will be posted on Canvas for future review. All students are expected attend lectures in person if at all feasible (i.e., not if you are sick or an SCPD remote student), in order to fully participate in class discussions and other synchronous activities. We understand that this isn't possible for every student every time, so if you are unable to attend we ask that you at least watch the video of class before the next class, so you are up to speed on all course topics and important announcements. Read more about lectures.
    
    Note about recording consent: Video cameras are located in the back of the lecture room to capture the instructor presentation. These recordings might be reused in other Stanford courses, viewed by other Stanford students, faculty, or staff, or used for other education and research purposes. While the cameras are positioned with the intention of recording only the instructor, occasionally a part of your image or voice might be incidentally captured. If you have questions, please contact a member of the teaching team.
    
    Sections
    Each students is assigned to a weekly small group discussion section, led by an undergraduate section leader. Your section leader is your mentor, grader, and personal connection to the greater CS106B course staff.
    
    Sections begin the second week of classes, and attendance and participation are mandatory for all students. Your section leader will evaluate your section participation; this contributes to your course grade.
    
    Read more about section.
    
    Assignments
    There will be regular assignments, about one per week. An assignment may include written problems, hands-on exercises with the tools, coding tasks and/or a larger complete program. Assignments are to be completed individually.
    
    Programs are graded on "functionality" (is the program's behavior correct?) and "style" (is the code well-written and designed cleanly?). We use a bucket grading scale to focus attention on the qualitative rather than quantitative feedback. Read more about assignments, grading, and late policy.
    
    Exams
    We have mid-quarter and end-quarter exams. The mid-quarter is a check-in to assess your understanding of core topics covered in the first half of the course and help you chart a path forward. The final is a comprehensive assessment of your mastery of the course learning goals.
    
    Mark these dates in your calendar now!
    
    Midterm: Thursday, February 15, 7:00 - 9:00 PM
    Final: Monday, March 18, 8:30 - 11:30 AM
    Read more about exams.
    
    Course Grades
    Final grades for the course will be determined using the following weights:
    
    53% Programming assignments
    15% Mid-quarter exam
    25% End-quarter final exam
    5% Section participation
    2% Quiz 0 on canvas
    In order to receive a passing grade in the course, you must earn a passing grade on the programming assignments as well as (collectively) the exams (i.e., failing an exam will not disqualify you from passing the course, as long as your average across both exams is a passing grade). So, someone who has a passing exam average but a failing average on the programming assignments, or vice versa, will not receive a passing grade in the course.
    
    Units
    If you are an undergraduate, you must enroll in CS106B for 5 units (this is by department and university policy, no exceptions). If you are a graduate student, you may enroll in CS106B for 3 or 4 units to reduce your units for administrative reasons. Taking the course for reduced units has no change on the course workload.
    
    Incompletes
    The university “I” grade (“incomplete”) is sometimes appropriate for circumstances of significant personal or family emergency disruption that occur late in the quarter and prevent a student from finishing course requirements on schedule. In order to be eligible for an Incomplete, University policy stipulates that a student must have completed a “substantial” part of the course work in “satisfactory” fashion. There must also be extenuating circumstances that warrant an extension of time beyond the end of the quarter to complete the remaining work. Approval for an incomplete is at the instructors’ discretion. Incompletes are not be considered for reasons such as poor performance in the course or over-commitment. Withdrawal from the course is more appropriate in those cases.
    
    Honor Code
    As a student taking a Stanford course, you agree to abide by the Stanford Honor Code, and we expect you to read over and follow our specific CS106B Honor Code policy. The work you submit for grading must be your own original, independent effort and must not be based on, guided by, or jointly developed with the work of others.
    
    The CS department employs powerful automated plagiarism detection tools that compare assignment submissions with other submissions from the current and previous quarters, as well as related online resources. The tools also analyze your intermediate work, and we will run the tools on every assignment you submit.
    
    The vast majority of you are here to learn and will do honest work for an honest grade. We celebrate and honor your commitment. Because it’s important that all cases of academic dishonesty are identified for the sake of those playing by the rules, we will refer all cases of concern to the Office of Community Standards.
    
    Course Resources
    Textbook
    Roberts, Eric. Programming Abstractions in C++. ISBN 978-0133454840.
    
    You can find different options to access the textbook here . Recommended readings for each lecture will be posted on our lecture schedule.
    
    Software
    The official CS106 programming environment is Qt Creator, which is an editor bundled with C++ compiler and libraries. The software runs on Windows, Mac, and Linux and is free for personal/student use. The Qt Installation Guide has instructions for installing the tools onto your computer.
    
    Getting help
    We want to enable everyone to succeed in this course and offer different paths to help.
    
    The instructors and Head TA will hold weekly office hours. The section leaders staff LaIR helper hours. The CS106B Ed Discussion forum allows public Q&A and discussion with your peers. Here is the Quick Start Guide to using Ed.
    
    Accommodations
    Students who need an academic accommodation based on the impact of a disability should initiate a request with the Office of Accessible Education. Professional staff will evaluate the request with required documentation, recommend reasonable accommodations, and prepare an Accommodation Letter dated in the current quarter. Students should contact the OAE as soon as possible since timely notice is needed to coordinate accommodations. The OAE has contact information on their web page: http://oae.stanford.edu. Once you obtain your OAE letter, please send it to the head TA.
    
    Course Tools
    The central place for CS106B resources is the course website right here at https://cs106b.stanford.edu. The website is your go-to for course materials (lectures, assignments, sections, exams) and course policies and information.
    
    We also make use use these additional tools:
    
    Canvas to publish lecture videos and lecture quizzes.
    Ed Discussion forum for online community, Q&A, and posted announcements.
    Paperless, our custom site for submitting assignments and viewing grading feedback.
    LaIR, our custom tool for mananging the queue in helper hours.
    Gradescope, for viewing graded exams.

    Here are the problem sets:
    
    Here is Assignment A1:
    
    The code you are to write uses expressions, control structures, functions, and string processing. Your prerequisite work means you should be familiar with these concepts; the novelty comes in figuring how to take what you already know and translate into the curious new world of C++. You also will build familiarity with the development tools we use and be introduced to strategies for testing and debugging your code. By the time you've completed the assignment, you'll be more comfortable working in C++ and ready to start building larger projects, or as we like to say, you'll have gotten your C++ legs under you! (apologies for the bad pun…)
    
    This assignment is to be completed individually. Working in pairs/groups is not permitted.
    
    The Learning goals are
    To become comfortable using Qt Creator to edit, build, run, and debug simple C++ programs.
    To practice writing C++ functions that manipulate numbers and strings.
    To learn basic use of the SimpleTest framework for unit tests and time trials.
    Assignment parts
    This assignment consists of two parts. 
    
    Part 1: Perfect Numbers is a warmup exercise involving number theory, algorithms, and optimization. It gives you a guided transition into C++ and the testing and debugging tools we use. You can start on this task right away — and we recommend doing so! Completing the warmup in the first few days reserves the better part of the week for the bigger second part.
    
    Part 2: Soundex Search is a complete program that demonstrates a nifty algorithm for matching and grouping names based on their pronunciation. This program uses C++ strings, console I/O, and the Vector class. There is a substantial chunk of code for you to write, so get an early start to give yourself sufficient time to work through issues and reach out for help if you hit any snags.
    
    The starter project is provided as a zip archive. Download the zip, extract the files, and move the project folder to your CS106B folder. Open the .pro file in Qt Creator to get started.
    
    Here are some resources: 
    The CS106B guide to SimpleTest on testing your code using the SimpleTest framework.
    A guide to C++ strings written by our awesome colleague Keith Schwarz.
    This Python to C++ transition guide points out syntactical and functional differences between the two languages. Thank you to section leaders Jillian Tang and Ethan Chi for this wonderful resource.
    Resolving Common Build/Run Errors, compiled by section leader Jillian Tang.
    The CS106B Style Guide explains the rubric and standards we use when evaluating the style of your code.
    Getting Help
    Keep an eye on the Ed forum for an announcement of the Assignment 1 YEAH (YEAH = Your Early Assignment Help) group session where our veteran section leaders will answer your questions and share pro tips. We know it can be daunting to sit down and break the barrier of starting on a substantial programming assignment – come to YEAH for advice and confidence to get you on your way!
    
    We also here to help if you get run into issues along the way! The Ed forum is open 24/7 for general discussion about the assignment, lecture topics, the C++ language, using Qt, and more. Always start by searching first to see if your question has already been asked and answered before making a new post. To troubleshoot a problem with your specific code, your best bet is to bring it to the LaIR helper hours or office hours.
    
    Instructions for submitting:
    Before you call it done, run through our submit checklist to be sure all your ts are crossed and is are dotted. Then upload your completed files to Paperless for grading.
    
    Please submit only the files you edited; for this assignment, these files will be:
    
    perfect.cpp
    soundex.cpp
    short_answer.txt
    You don't need to submit any of the other files in the project folder.
    
    That's it; you're done! Congratulations on finishing your first CS106B assignment!
    
    Here is Assignment A2:	
    Warmup: Practice with testing and debugging on different abstract data types. Do the warmup first!
    
    Maze: A Grid of walls and corridors is used to represent a maze, and the Vector, Stack, Queue, and Set ADTs are used in a clever algorithm to find a solution path that escapes the maze.
    
    Search Engine: A Map is used to associate words with a Set of documents containing that word. Using the map, you can find matching entries that contain terms from simple or compound queries, and construct a mini search engine.
    
    Beyond Algorithmic Analysis: In this section, you will consider some of the human and societal impacts of designing and optimizing efficient software systems.`;

    setChatSettings({
      model: (workspace?.default_model || "gpt-4-1106-preview") as LLMID,
      prompt: promptInfo,
      temperature: workspace?.default_temperature || 0.5,
      contextLength: workspace?.default_context_length || 4096,
      includeProfileContext: workspace?.include_profile_context || true,
      includeWorkspaceInstructions:
        workspace?.include_workspace_instructions || true,
      embeddingsProvider:
        (workspace?.embeddings_provider as "openai" | "local") || "openai"
    })

    setLoading(false)
  }

  if (loading) {
    return <Loading />
  }

  return <Dashboard>{children}</Dashboard>
}
