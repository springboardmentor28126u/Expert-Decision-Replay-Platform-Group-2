import { useEffect, useState } from "react";
import API from "../services/api";

function FileList({ decisionId }) {

  const [files, setFiles] = useState([]);

  const loadFiles = async () => {

    try {

      const response = await API.get(
        `/files/${decisionId}`
      );

      setFiles(response.data);

    } catch (error) {

      console.log(error);

    }

  };

  useEffect(() => {

    loadFiles();

  }, [decisionId]);

  const handleDelete = async (id) => {

    try {

      await API.delete(`/files/${id}`);

      loadFiles();

    } catch (error) {

      console.log(error);

      alert("Unable to delete file.");

    }

  };

  return (

    <div>

      {/* <h3>Uploaded Files</h3> */}

      <table>

        <thead>

          <tr>

            {/* <th>File Name</th>

            <th>Uploaded Time</th>

            <th>Action</th> */}

          </tr>

        </thead>

        <tbody>

          {files.map((file) => (

            <tr key={file.id}>

              <td>{file.filename}</td>

              <td>{file.uploaded_at}</td>

              <td>

                

              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>

  );

}

export default FileList;