FROM node:22 as build
RUN corepack prepare yarn@stable --activate

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build

FROM python:3.11-slim
WORKDIR /app

# Copy the build directory from the previous stage
COPY --from=build /app/dist /app/dist
COPY server /app/server
COPY server/requirements.txt /app/server

WORKDIR /app/server
RUN pip install -r requirements.txt
ENV DIST_DIR=/app/dist/

# Command to run on container start
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
EXPOSE 8080