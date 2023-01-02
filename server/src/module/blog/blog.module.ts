import {Module} from "@nestjs/common";
import {BlogController} from "./blog.controller";
import {BlogCommentController} from "./comment.controller";
import {CommentService} from "./comment.service";
import {DemoController} from "./demo.controller";
import {DemoService} from "./demo.service";

@Module({
    controllers: [BlogController, BlogCommentController, DemoController],
    providers: [CommentService, DemoService]
})
export class BlogModule {
}