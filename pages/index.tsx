import * as React from "react";
import type { NextPage } from "next";
import { FileDrop } from "react-file-drop";
import axios, { AxiosResponse } from "axios";
import Image from "next/image";
import {
  Body,
  Button,
  Container,
  DropLine,
  DropZone,
  Header,
  ImageContainer,
  InnerContainer,
  InputBar,
  SelectFile,
  ShowImage,
  SubTitle,
  Title,
} from "../styled-components/Home";
import Upload from "../components/Upload";
import ToggleDarkMode from "../components/ToggleDarkMode";
import { toast } from "react-toastify";
import { getThemeContext } from "../context/ThemeContext";
import { useRouter } from "next/router";
import config from "../config";

export interface AxoisData extends AxiosResponse {
  data: {
    [key: string]: string | any;
  };
}
// URL going to be provided
// /image/[id]  => id represents the image

const Home: NextPage = () => {
  const { theme } = getThemeContext();
  const fileRef = React.useRef<any>(null);

  const [imageLink, setImageLink] = React.useState<string>();
  const [track, setTrack] = React.useState<boolean>(false);
  const [file, setFile] = React.useState<FileList | null>();
  const [uploading, setUploading] = React.useState<boolean>(false);
  const [uploadingPercentage, setPercentage] = React.useState<number>(0);
  const [finalLink, setFinalLink] = React.useState<string>("");

  const [status, setStatus] = React.useState<{ type: string; str: string }>({
    type: "",
    str: "",
  });

  const createLink = ({ url }: { url: string }) => {
    axios
      .get(url)
      .then(({ data }: AxoisData) => {
        setStatus({
          type: "Link Generated",
          str: "Your link has been successfully generated",
        });

        setFinalLink(data.path);
        setImageLink(data.copyPath);
        setUploading(false);
        setStatus({ str: "", type: "" });
      })
      .catch((err) => {
        console.log(err);
        setStatus({ str: "Cannot able to generate link", type: "Error" });
      });
  };

  const copyToClipboard = (str: string) => {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(str);
      return toast.success("Link copied", {
        position: "bottom-left",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: theme ? "dark" : "light",
      });
    }
    return toast.warn("Copy API is not available in your browser", {
      position: "bottom-left",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
      progress: undefined,
      theme: theme ? "dark" : "light",
    });
  };

  // upload Function
  const uploadFiles = (data: FormData) => {
    axios // put cloudinary post url here
      .post("/api/upload", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress(progressEvent: any) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setPercentage(percentCompleted);
        },
      })
      .then(({ status, data }: AxoisData) => {
        if (status === 200 || status === 201) {
          setStatus({ str: "File Uploaded", type: "Uploaded" });

          createLink({
            url: "/api/image?id=" + data.filename,
          });
          setStatus({
            type: "Generating Link",
            str: "Creating a link for your image",
          });
        }
      })
      .catch(() => setStatus({ type: "Error", str: "Cannot able to upload" }));
  };

  const formDataFunc = (file: FileList | any) => {
    setUploading(true);
    setStatus({
      type: "Uploading",
      str: "Sending file to server",
    });
    const formData = new FormData();
    formData.append("files", file[0]);
    const timestamp = Date.now() / 1000;
    formData.append("timestamp", timestamp.toString());
    uploadFiles(formData);
  };

  // onDrop Func
  const onDropFunc = () => {
    const fileTypes = /jpeg|jpg|png|gif|svg|webp|apng|avif|bmp|ico|tiff/;
    setUploading(true);
    if (file) {
      setStatus({
        type: "Checking",
        str: "Your file is being uploaded to the server. Dont Refresh :)",
      });
      if (fileTypes.test(file[0].type)) {
        return formDataFunc(file);
      } else {
        return setStatus({
          type: "Error",
          str: "Select only image",
        });
      }
    } else {
      return setStatus({
        type: "Error",
        str: "Select only image to upload",
      });
    }
  };

  const onTargetClickFunc = () => {
    fileRef.current.click();
  };

  const onFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const data = new FormData();
    const { files } = event.target;
    files === null
      ? setStatus({
          type: "Error",
          str: "Select File to upload",
        })
      : data.append("files", files[0]);
    setUploading(true);
    setStatus({ str: "Uploading file", type: "Uploading" });
    data.get("files") && uploadFiles(data);
  };

  const uploadstatus = (e: boolean) => {
    setUploading(e);
    setStatus({ str: "", type: "" });
  };

  const resetFunc = () => {
    setImageLink(undefined);
    setTrack(false);
    setFile(null);
    setUploading(false);
    setPercentage(0);
    setFinalLink("");
    setStatus({ str: "", type: "" });
  };

  return (
    <Container>
      {uploading && (
        <Upload
          uploadstatus={uploadstatus}
          str={status.str}
          type={status.type}
        />
      )}
      <InnerContainer>
        {imageLink !== undefined && (
          <p className="back__" onClick={() => resetFunc()}>
            Back
          </p>
        )}
        {imageLink !== undefined ? (
          <Header>
            <img src="/done.svg" className="img" width={40} height={40} />
            <Title>Uploaded</Title>
          </Header>
        ) : (
          <Header>
            <Title>Upload your image</Title>
            <SubTitle>File should be JPEG, PNG..,</SubTitle>
          </Header>
        )}
        <Body dragMoment={track}>
          {typeof finalLink === "string" && finalLink.length > 1 ? (
            <ShowImage>
              <Image
                src={finalLink}
                alt="Image Alt"
                layout="fill"
                objectFit="cover"
              />
            </ShowImage>
          ) : (
            <FileDrop
              dropEffect="move"
              onFrameDragEnter={() => setTrack(true)}
              onDragOver={(a) => console.log(a)}
              onTargetClick={onTargetClickFunc}
              onDrop={(files) => {
                setFile(files);
                onDropFunc();
              }}
              onDragLeave={() => console.log("leaved")}
              onFrameDragLeave={() => setTrack(false)}
            >
              {/* <DropZone> */}
              <ImageContainer>
                <Image
                  src={"/image.svg"}
                  layout="responsive"
                  width={115}
                  height={90}
                  objectFit="contain"
                  blurDataURL=""
                />
                <DropLine>Drag {"&"} Drop your files here</DropLine>
              </ImageContainer>
              {/* </DropZone> */}
            </FileDrop>
          )}
        </Body>
        {typeof imageLink === "undefined" ? (
          <>
            <DropLine>Or</DropLine>
            <SelectFile
              onClick={() => document.getElementById("file")?.click()}
            >
              Choose a file
              <input
                accept="image/*"
                onChange={onFileInput}
                ref={fileRef}
                type="file"
                id="file"
                hidden
              />
            </SelectFile>
          </>
        ) : (
          <InputBar>
            <input
              className="input"
              id="cpy"
              placeholder="Hello"
              defaultValue={imageLink}
              contentEditable={false}
              about="URL for uploaded image"
              type={"url"}
            />
            <Button onClick={() => copyToClipboard(imageLink)}>
              Copy Link
            </Button>
          </InputBar>
        )}
      </InnerContainer>
      <ToggleDarkMode />
    </Container>
  );
};

export default Home;
